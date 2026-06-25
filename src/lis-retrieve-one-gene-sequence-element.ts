import {LitElement, css, html} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {LisCancelPromiseController} from './controllers';
import {LisLoadingElement, LisSimpleTableElement} from './core';
import {
  FastaRecord,
  MAX_FLANK_BASES,
  computeFlankRegion,
  extractFullYuckPrefix,
  formatFasta,
  reverseComplement,
} from './utils/sequence-fasta';

/**
 * Pull the `error` string out of a `{error, status}` JSON body that the
 * Python services return on 4xx/5xx. Best-effort: returns "" if the body
 * isn't JSON or doesn't have the expected shape.
 */
async function readErrorMessage(resp: Response): Promise<string> {
  try {
    const body = (await resp.json()) as {error?: unknown};
    return typeof body?.error === 'string' ? body.error : '';
  } catch {
    return '';
  }
}

/**
 * pysam's TabixFile / FastaFile constructors raise OSError with messages
 * like "could not open file `<url>`" when the sibling index (.tbi / .fai /
 * .gzi / .csi) is missing on the remote file — the most common reason a
 * working backend can't serve a known-good URL. Detect that string so the
 * UI can point at curation rather than at the service.
 */
function looksLikeMissingPysamIndex(errMsg: string): boolean {
  return /could not open file|Unable to open file/i.test(errMsg);
}

/** Last path segment of a URL, for compact filenames in error messages. */
function lastUrlSegment(url: string): string {
  const noQuery = url.split('?')[0];
  const segments = noQuery.split('/');
  return segments[segments.length - 1] || url;
}

/**
 * URLs the catalog produces for a single annotation prefix. Mirrors the
 * dscensor `/files/{prefix}` response shape so the type carries the same
 * nullability semantics (a URL is null when the catalog can't confirm the
 * underlying file follows the suffix-substitution convention).
 */
export type RetrieveSequenceFiles = {
  protein_url: string | null;
  cds_url: string | null;
  genome_url: string | null;
  genus?: string | null;
  species?: string | null;
  infraspecies?: string | null;
};

/**
 * The gene's location on its chromosome, as resolved from GraphQL, paired
 * with the primary mRNA identifier.
 *
 * Protein and CDS are fetched by `mrnaId` (`<gene_id>.1`) out of the
 * `*_primary` FASTAs; the genomic slice is cut from `start`/`end`, which come
 * from the gene's `chromosomeLocation` (see below). `start`/`end` are stored
 * 0-based half-open (pysam's convention) — see
 * {@link LisRetrieveOneGeneSequenceElement._fetchGeneLocation} for the
 * conversion from InterMine's 1-based inclusive coordinates.
 */
export type RetrieveSequenceMrnaLocation = {
  molecule: string;
  start: number;
  end: number;
  mrnaId: string;
  strand: string;
};

/** Subset of the `gene(identifier:)` GraphQL response we consume. */
type GraphQLGeneResponse = {
  data?: {
    gene?: {
      results?: {
        identifier: string;
        chromosomeLocation: {
          start: number;
          end: number;
          strand: string | null;
        } | null;
        chromosome: {identifier: string} | null;
      } | null;
    } | null;
  };
  errors?: Array<{message: string}>;
};

/**
 * GraphQL query for the gene's chromosomal span. Sent as a string body to
 * keep the component dependency-free — no GraphQL client runtime is needed
 * for a single hand-written query of this size.
 *
 * We query the gene-level `chromosomeLocation` rather than the per-mRNA
 * location. Although protein/CDS are keyed by the primary mRNA identifier
 * (`<gene_id>.1`), the LIS InterMine instances do **not** populate
 * `MRNA.chromosomeLocation` — `mRNA(identifier:).chromosomeLocation` comes
 * back `null` (verified against `graphql-genefunction`, 2026-06). Only
 * `Gene.chromosomeLocation` carries coordinates, so it is the genomic slice's
 * source of truth. For a single-isoform gene this is exactly the transcript
 * locus; for a multi-isoform gene it is the union span across isoforms (with
 * UTRs), which is the spec-faithful "genomic sequence of the gene."
 *
 * Note we deliberately avoid `Gene.transcripts`: it returns the `Transcript`
 * *interface*, and the graphql-server (as of 2026-06) has no `__resolveType`
 * for it, so that query fails with "Abstract type Transcript must resolve to
 * an Object type at runtime." The `gene(identifier:)` field returns the
 * concrete `Gene` type, so no interface resolution is involved and no
 * upstream server change is required.
 */
const GENE_BY_IDENTIFIER_QUERY = `
  query GeneByID($identifier: ID!) {
    gene(identifier: $identifier) {
      results {
        identifier
        chromosomeLocation { start, end, strand }
        chromosome { identifier }
      }
    }
  }
`;

/**
 * Suffix appended to a gene ID to address its primary mRNA in LIS
 * `_primary.faa.gz` / `_primary.fna.gz` FASTA files, and the mRNA whose
 * `chromosomeLocation` we query for the genomic slice. The LIS curation
 * pipeline puts the canonical isoform into these files keyed by the
 * `<gene_id>.1` mRNA identifier. Held as a constant so the assumption is
 * easy to find and revisit.
 */
const PRIMARY_MRNA_SUFFIX = '.1';

/**
 * Per-sequence-type download metadata, keyed by the sequence-type token that
 * `_defaultRetrieve` embeds as the second header token (`protein` / `cds` /
 * `genome`). Downloads are split into one file per type, named
 * `<id>.<label>.<ext>` (e.g. `<gene>.protein.faa`), with the
 * biologically-correct FASTA extension: `.faa` (amino acid) for protein,
 * `.fna` (nucleic acid) for the two nucleotide outputs. The `label` token then
 * disambiguates the two `.fna` files from each other.
 */
const DOWNLOAD_TYPE_META: Record<string, {label: string; ext: string}> = {
  protein: {label: 'protein', ext: 'faa'},
  cds: {label: 'CDS', ext: 'fna'},
  genome: {label: 'genomic', ext: 'fna'},
};

/**
 * Form data submitted to the retrieve function when the user clicks SEARCH.
 *
 * `basesUpstream` / `basesDownstream` only apply when `genome === true` and are
 * already clamped to [0, MAX_FLANK_BASES] before reaching the retrieve function.
 */
export type RetrieveOneGeneSearchData = {
  geneId: string;
  protein: boolean;
  cds: boolean;
  genome: boolean;
  basesUpstream: number;
  basesDownstream: number;
};

/** Optional parameters passed alongside the form data. */
export type RetrieveOneGeneOptions = {abortSignal?: AbortSignal};

/**
 * Function signature for fully overriding the backend orchestration.
 *
 * Provided so consumers can swap in a mocked / pre-cached / GraphQL-fronted
 * implementation without re-deriving the element's form logic. When not set
 * the element uses its built-in dscensor + ds_utilities chain against the
 * configured base URLs.
 */
export type RetrieveOneGeneFunction = (
  searchData: RetrieveOneGeneSearchData,
  options: RetrieveOneGeneOptions,
) => Promise<FastaRecord[]>;

/**
 * @htmlElement `<lis-retrieve-one-gene-sequence-element>`
 *
 * Component 1 of the LIS retrieve-sequence spec (v0.5.0): given a single gene
 * ID, fetch protein / CDS / genomic sequences and surface them as a table plus
 * a Download-as-FASTA action. Out of the box it talks to a dscensor instance,
 * a GraphQL server, and a ds_utilities instance over HTTP — set
 * {@link dscensorBase | `dscensorBase`},
 * {@link graphqlEndpoint | `graphqlEndpoint`}, and
 * {@link dsUtilitiesBase | `dsUtilitiesBase`} to point at your services, or
 * replace the whole chain by assigning
 * {@link retrieveFunction | `retrieveFunction`}.
 *
 * @example
 * ```html
 * <lis-retrieve-one-gene-sequence-element
 *   id="retrieve"
 *   dscensorBase="http://localhost:8765"
 *   graphql-endpoint="https://mines.example.org/graphql"
 *   dsUtilitiesBase="http://localhost:8080"
 * ></lis-retrieve-one-gene-sequence-element>
 * ```
 */
@customElement('lis-retrieve-one-gene-sequence-element')
export class LisRetrieveOneGeneSequenceElement extends LitElement {
  /** @ignore */
  static override styles = css``;

  /** @ignore */
  // Disable Shadow DOM so the host page's UIKit styles apply to our form.
  override createRenderRoot() {
    return this;
  }

  /** Base URL of the dscensor service (no trailing slash). */
  @property({type: String, attribute: 'dscensor-base'})
  dscensorBase: string = 'http://localhost:8765';

  /** Base URL of the ds_utilities service (no trailing slash). */
  @property({type: String, attribute: 'ds-utilities-base'})
  dsUtilitiesBase: string = 'http://localhost:8080';

  /**
   * GraphQL endpoint URL. Required: the element resolves the gene's
   * coordinates by POSTing a `gene(identifier:)` query to this endpoint and
   * has no other path. An empty value causes the retrieve to throw with a
   * clear configuration error.
   */
  @property({type: String, attribute: 'graphql-endpoint'})
  graphqlEndpoint: string = '';

  /**
   * Optional override of the backend orchestration. When unset the element
   * runs the built-in dscensor → ds_utilities chain against the base URLs.
   */
  @property({type: Function, attribute: false})
  retrieveFunction?: RetrieveOneGeneFunction;

  // Controller cancels any in-flight retrieve when the user re-submits or the
  // host element disconnects, so a slow protein fetch can't overwrite results
  // from a faster genome-only query the user just started.
  protected cancelPromiseController = new LisCancelPromiseController(this);

  @state() private _geneId: string = '';
  @state() private _protein: boolean = true;
  @state() private _cds: boolean = false;
  @state() private _genome: boolean = false;
  @state() private _basesUpstream: string = '0';
  @state() private _basesDownstream: string = '0';
  @state() private _records: FastaRecord[] = [];

  @query('lis-simple-table-element') private _table!: LisSimpleTableElement;
  private _loadingRef: Ref<LisLoadingElement> = createRef();

  /**
   * Programmatic entry point for triggering a retrieve from outside the form.
   *
   * Useful for `window.onload` demos and for code that wants to drive the
   * element from URL query parameters.
   */
  public retrieve(data?: Partial<RetrieveOneGeneSearchData>): void {
    if (data?.geneId !== undefined) this._geneId = data.geneId;
    // Sequence type is exclusive: the last type set to `true` wins, mirroring
    // the radio-button UI. Order protein → cds → genome so an explicit later
    // selection overrides an earlier one in the same call.
    if (data?.protein) this._selectSequenceType('protein');
    if (data?.cds) this._selectSequenceType('cds');
    if (data?.genome) this._selectSequenceType('genome');
    if (data?.basesUpstream !== undefined)
      this._basesUpstream = String(data.basesUpstream);
    if (data?.basesDownstream !== undefined)
      this._basesDownstream = String(data.basesDownstream);
    this._submit();
  }

  // Sequence type is mutually exclusive (Protein, CDS, or Genome). Selecting
  // one clears the others so exactly one boolean is ever true, matching the
  // radio-button UI while keeping the protein/cds/genome data contract that the
  // retrieve and download logic relies on.
  private _selectSequenceType(type: 'protein' | 'cds' | 'genome'): void {
    this._protein = type === 'protein';
    this._cds = type === 'cds';
    this._genome = type === 'genome';
  }

  private _searchData(): RetrieveOneGeneSearchData {
    return {
      geneId: this._geneId.trim(),
      protein: this._protein,
      cds: this._cds,
      genome: this._genome,
      basesUpstream: this._clampFlankInput(this._basesUpstream),
      basesDownstream: this._clampFlankInput(this._basesDownstream),
    };
  }

  private _clampFlankInput(raw: string): number {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(Math.floor(n), MAX_FLANK_BASES);
  }

  private _submit(event?: Event): void {
    event?.preventDefault();
    const data = this._searchData();
    if (!data.geneId) {
      this._loadingRef.value?.error('Enter a gene ID before searching.');
      return;
    }
    if (!data.protein && !data.cds && !data.genome) {
      this._loadingRef.value?.error('Select at least one sequence type.');
      return;
    }
    this._records = [];
    if (this._table) this._table.data = [];
    this._loadingRef.value?.loading();
    this.cancelPromiseController.cancel();
    const options = {abortSignal: this.cancelPromiseController.abortSignal};
    const fn = this.retrieveFunction ?? this._defaultRetrieve.bind(this);
    const retrievePromise = fn(data, options);
    this.cancelPromiseController.wrapPromise(retrievePromise).then(
      (records: FastaRecord[]) => this._handleSuccess(records),
      (error: Error | Event) => {
        if (error instanceof Event && error.type === 'abort') return;
        const message =
          error instanceof Error ? error.message : 'unknown error';
        this._loadingRef.value?.error(`Retrieve failed: ${message}`);
      },
    );
  }

  private _handleSuccess(records: FastaRecord[]): void {
    this._records = records;
    if (records.length === 0) {
      this._loadingRef.value?.noResults();
    } else {
      this._loadingRef.value?.success();
    }
    if (this._table) {
      this._table.data = records.map((r) => ({
        type: this._typeFromHeader(r.header),
        header: r.header,
        length: r.sequence.length.toString(),
        preview: r.sequence.slice(0, 40) + (r.sequence.length > 40 ? '…' : ''),
      }));
    }
  }

  // Header strings produced by _defaultRetrieve embed the sequence type as the
  // second whitespace-delimited token; surface it as its own column so the
  // table reads like the spec's mockup without forcing callers to parse FASTA
  // headers themselves.
  private _typeFromHeader(header: string): string {
    const parts = header.split(/\s+/);
    return parts[1] ?? '';
  }

  // Downloads are split into one file per sequence type, named
  // `<gene>.<type>.<ext>` (e.g. `<gene>.protein.faa`, `<gene>.CDS.fna`,
  // `<gene>.genomic.fna`) so the user can tell the three FASTAs apart and the
  // extension matches the sequence type. A gene query yields at most one
  // record per type; records are grouped by type so this stays correct if that
  // ever changes.
  private _download(): void {
    if (this._records.length === 0) return;
    const base = this._geneId.replace(/[^A-Za-z0-9._-]+/g, '_') || 'sequence';
    const groups = new Map<string, FastaRecord[]>();
    for (const record of this._records) {
      const type = this._typeFromHeader(record.header);
      const list = groups.get(type) ?? [];
      list.push(record);
      groups.set(type, list);
    }
    for (const [type, records] of groups) {
      const meta = DOWNLOAD_TYPE_META[type] ?? {
        label: type || 'sequence',
        ext: 'fa',
      };
      this._triggerDownload(
        `${base}.${meta.label}.${meta.ext}`,
        formatFasta(records),
      );
    }
  }

  private _triggerDownload(filename: string, contents: string): void {
    const blob = new Blob([contents], {type: 'text/x-fasta'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // The built-in chain: dscensor /files/{prefix} → GraphQL gene query →
  // ds_utilities /fasta/fetch per requested sequence type. Kept inside the
  // element so the spec's flow Just Works against the default localhost
  // ports; consumers needing a different transport replace this via
  // `retrieveFunction`.
  private async _defaultRetrieve(
    data: RetrieveOneGeneSearchData,
    options: RetrieveOneGeneOptions,
  ): Promise<FastaRecord[]> {
    if (!this.graphqlEndpoint) {
      throw new Error(
        `graphqlEndpoint is not set — this element resolves the gene's ` +
          `coordinates via GraphQL only. Set the \`graphql-endpoint\` ` +
          `attribute or the ` +
          `\`graphqlEndpoint\` property on the element.`,
      );
    }
    const signal = options.abortSignal;
    const prefix = extractFullYuckPrefix(data.geneId);
    const files = await this._fetchFiles(prefix, signal);
    const row = await this._fetchGeneLocation(data.geneId, signal);
    const records: FastaRecord[] = [];
    if (data.protein) {
      if (!files.protein_url) {
        throw new Error(
          `dscensor catalog has no protein_url for prefix "${prefix}".`,
        );
      }
      const seq = await this._fetchFasta(row.mrnaId, files.protein_url, signal);
      records.push({
        header: `${row.mrnaId} protein gene=${data.geneId}`,
        sequence: seq,
      });
    }
    if (data.cds) {
      if (!files.cds_url) {
        throw new Error(
          `dscensor catalog has no cds_url for prefix "${prefix}".`,
        );
      }
      const seq = await this._fetchFasta(row.mrnaId, files.cds_url, signal);
      records.push({
        header: `${row.mrnaId} cds gene=${data.geneId}`,
        sequence: seq,
      });
    }
    if (data.genome) {
      if (!files.genome_url) {
        throw new Error(
          `dscensor catalog has no genome_url for prefix "${prefix}".`,
        );
      }
      records.push(
        await this._fetchGenomicSlice(
          row,
          files.genome_url,
          data.basesUpstream,
          data.basesDownstream,
          data.geneId,
          signal,
        ),
      );
    }
    return records;
  }

  /**
   * Resolve the gene's chromosomal span via the GraphQL server, paired with
   * the primary mRNA identifier.
   *
   * Queries the `gene(identifier:)` field for `<gene_id>` and returns its
   * `chromosomeLocation` — the source of truth for the genomic slice. The
   * per-mRNA location is not populated in the LIS mines, so the gene location
   * is used (see {@link GENE_BY_IDENTIFIER_QUERY}). The returned `mrnaId`
   * (`<gene_id>.1`) keys the protein/CDS lookups from the `*_primary` FASTAs.
   *
   * Coordinates are converted from InterMine's 1-based inclusive convention
   * to the 0-based half-open convention pysam expects: `start - 1`, `end`
   * unchanged. (For an inclusive range [s, e], the half-open equivalent is
   * [s-1, e).) Skipping this conversion shifts every genomic slice one base
   * 5′ — the off-by-one we chased earlier.
   *
   * Throws on any "no result" outcome — gene not in the mine, network/HTTP
   * error, GraphQL `errors` field set, or missing chromosome/location
   * fields. There is no fallback path; the caller surfaces the thrown
   * message.
   */
  private async _fetchGeneLocation(
    geneId: string,
    signal?: AbortSignal,
  ): Promise<RetrieveSequenceMrnaLocation> {
    const mrnaId = `${geneId}${PRIMARY_MRNA_SUFFIX}`;
    let body: GraphQLGeneResponse;
    try {
      const resp = await fetch(this.graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: GENE_BY_IDENTIFIER_QUERY,
          variables: {identifier: geneId},
        }),
        signal,
      });
      if (!resp.ok) {
        throw new Error(`GraphQL endpoint returned HTTP ${resp.status}.`);
      }
      body = (await resp.json()) as GraphQLGeneResponse;
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error(`GraphQL request failed: ${String(err)}`);
    }
    if (body.errors && body.errors.length > 0) {
      throw new Error(
        `GraphQL server reported errors: ${body.errors
          .map((e) => e.message)
          .join('; ')}`,
      );
    }
    const result = body.data?.gene?.results;
    if (!result) {
      throw new Error(
        `GraphQL server has no record for gene "${geneId}". It may not be ` +
          `loaded into the mine.`,
      );
    }
    const loc = result.chromosomeLocation;
    const chrom = result.chromosome?.identifier;
    if (!loc || !chrom) {
      throw new Error(
        `GraphQL response for gene "${geneId}" was missing chromosome or ` +
          `location fields.`,
      );
    }
    return {
      molecule: chrom,
      // InterMine 1-based inclusive → 0-based half-open for pysam.
      start: loc.start - 1,
      end: loc.end,
      mrnaId,
      strand: this._normalizeIntermineStrand(loc.strand),
    };
  }

  /**
   * InterMine reports strand as `"1"` / `"-1"` / `"0"`; downstream consumers
   * (computeFlankRegion, reverseComplement) expect `"+"` / `"-"` /
   * `"."`. Map both common shapes; pass anything else through unchanged so
   * the consumer sees the raw value rather than us silently mis-translating.
   */
  private _normalizeIntermineStrand(strand: string | null): string {
    if (strand === null || strand === undefined) return '.';
    switch (strand) {
      case '1':
      case '+1':
      case '+':
        return '+';
      case '-1':
      case '-':
        return '-';
      case '0':
      case '.':
        return '.';
      default:
        return strand;
    }
  }

  private async _fetchFiles(
    prefix: string,
    signal?: AbortSignal,
  ): Promise<RetrieveSequenceFiles> {
    const url = `${this.dscensorBase}/files/${encodeURIComponent(prefix)}`;
    const resp = await fetch(url, {signal});
    if (resp.status === 404) {
      // Catalog-side curation gap rather than a service bug. Mention
      // lis-autocontent so the next reader knows which tool produces these.
      throw new Error(
        `The dscensor catalog has no entry for prefix "${prefix}". ` +
          `This usually means the autocontent JSON for this assembly hasn't ` +
          `been generated yet — the LIS data team produces them via ` +
          `\`lis-autocontent populate-dscensor\`.`,
      );
    }
    if (!resp.ok) {
      throw new Error(`dscensor /files returned HTTP ${resp.status}.`);
    }
    return (await resp.json()) as RetrieveSequenceFiles;
  }

  private async _fetchFasta(
    seqid: string,
    fastaUrl: string,
    signal?: AbortSignal,
  ): Promise<string> {
    const url =
      `${this.dsUtilitiesBase}/fasta/fetch/` +
      `${encodeURIComponent(seqid)}/${encodeURIComponent(fastaUrl)}`;
    const resp = await fetch(url, {signal});
    if (!resp.ok) {
      // A missing .fai / .gzi sibling on the FASTA produces a pysam
      // "could not open file" error rather than a transient
      // HTTP failure. Surface it specifically so users know to ask the data
      // team rather than retrying.
      const errMsg = await readErrorMessage(resp);
      if (looksLikeMissingPysamIndex(errMsg)) {
        const filename = lastUrlSegment(fastaUrl);
        throw new Error(
          `The FASTA at "${filename}" is reachable but its index ` +
            `(.fai/.gzi) is missing — pysam can't open the file without it. ` +
            `This is a data-side gap; the LIS data team needs to generate ` +
            `the index.`,
        );
      }
      throw new Error(
        `ds_utilities /fasta/fetch error: ${errMsg || `HTTP ${resp.status}`}`,
      );
    }
    const body = (await resp.json()) as {sequence?: string};
    if (typeof body.sequence !== 'string') {
      throw new Error(
        `ds_utilities /fasta/fetch response missing "sequence" field.`,
      );
    }
    return body.sequence;
  }

  private async _fetchGenomicSlice(
    row: RetrieveSequenceMrnaLocation,
    genomeUrl: string,
    upstream: number,
    downstream: number,
    geneId: string,
    signal?: AbortSignal,
  ): Promise<FastaRecord> {
    const {fetchStart, fetchEnd} = computeFlankRegion(
      row.start,
      row.end,
      row.strand,
      upstream,
      downstream,
    );
    // ds_utilities exposes coords as optional `start`/`end` query parameters
    // on /fasta/fetch/{seqid}/{url} — keeps integer ranges out of the URL
    // path (which avoids the encodeURIComponent-vs-route-pattern mismatch
    // the old `/fasta/fetch/{seqid}:{start}-{end}/{url}` form suffered from).
    const url =
      `${this.dsUtilitiesBase}/fasta/fetch/` +
      `${encodeURIComponent(row.molecule)}/${encodeURIComponent(genomeUrl)}` +
      `?start=${fetchStart}&end=${fetchEnd}`;
    const resp = await fetch(url, {signal});
    if (!resp.ok) {
      const errMsg = await readErrorMessage(resp);
      if (looksLikeMissingPysamIndex(errMsg)) {
        const filename = lastUrlSegment(genomeUrl);
        throw new Error(
          `The genome FASTA at "${filename}" is reachable but its index ` +
            `(.fai/.gzi) is missing — pysam can't open the file without it. ` +
            `This is a data-side gap; the LIS data team needs to generate ` +
            `the index.`,
        );
      }
      throw new Error(
        `ds_utilities /fasta/fetch error: ${errMsg || `HTTP ${resp.status}`}`,
      );
    }
    const body = (await resp.json()) as {sequence?: string};
    if (typeof body.sequence !== 'string') {
      throw new Error(
        `ds_utilities /fasta/fetch response missing "sequence" field.`,
      );
    }
    // ds_utilities serves plus-strand reference bases; we own the flip so the
    // returned sequence reads 5'→3' along the gene's transcribed strand.
    const sequence =
      row.strand === '-' ? reverseComplement(body.sequence) : body.sequence;
    const header =
      `${row.molecule}:${fetchStart}-${fetchEnd} genome ` +
      `gene=${geneId} strand=${row.strand} flanks=${upstream}/${downstream}`;
    return {header, sequence};
  }

  /** @ignore */
  override render() {
    const dataAttributes = ['type', 'header', 'length', 'preview'];
    const header = {
      type: 'Type',
      header: 'Header',
      length: 'Length',
      preview: 'Preview',
    };
    return html`
      <form class="uk-form-stacked" @submit=${(e: Event) => this._submit(e)}>
        <legend class="uk-legend">Retrieve sequence for one gene by ID</legend>

        <div class="uk-margin">
          <input
            class="uk-input"
            type="text"
            placeholder="Gene ID"
            .value=${this._geneId}
            @input=${(e: Event) =>
              (this._geneId = (e.target as HTMLInputElement).value)}
          />
          <small class="uk-text-muted">
            e.g., glyma.Wm82.gnm2.ann1.Glyma.08G002000
          </small>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label">
            <input
              class="uk-radio"
              type="radio"
              name="sequenceType"
              .checked=${this._protein}
              @change=${() => this._selectSequenceType('protein')}
            />
            Protein sequence
          </label>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label">
            <input
              class="uk-radio"
              type="radio"
              name="sequenceType"
              .checked=${this._cds}
              @change=${() => this._selectSequenceType('cds')}
            />
            CDS sequence
          </label>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label">
            <input
              class="uk-radio"
              type="radio"
              name="sequenceType"
              .checked=${this._genome}
              @change=${() => this._selectSequenceType('genome')}
            />
            Genome sequence:
          </label>
          <div class="uk-margin-left" ?hidden=${!this._genome}>
            <div class="uk-grid-small uk-flex-middle" uk-grid>
              <div class="uk-width-auto">
                <label class="uk-form-label">Bases upstream:</label>
              </div>
              <div class="uk-width-small">
                <input
                  class="uk-input"
                  type="number"
                  min="0"
                  max=${MAX_FLANK_BASES}
                  step="1"
                  .value=${this._basesUpstream}
                  @input=${(e: Event) =>
                    (this._basesUpstream = (
                      e.target as HTMLInputElement
                    ).value)}
                />
              </div>
              <div class="uk-width-auto">
                <small class="uk-text-muted"
                  >max ${MAX_FLANK_BASES} bases</small
                >
              </div>
            </div>
            <div
              class="uk-grid-small uk-flex-middle uk-margin-small-top"
              uk-grid
            >
              <div class="uk-width-auto">
                <label class="uk-form-label">Bases downstream:</label>
              </div>
              <div class="uk-width-small">
                <input
                  class="uk-input"
                  type="number"
                  min="0"
                  max=${MAX_FLANK_BASES}
                  step="1"
                  .value=${this._basesDownstream}
                  @input=${(e: Event) =>
                    (this._basesDownstream = (
                      e.target as HTMLInputElement
                    ).value)}
                />
              </div>
              <div class="uk-width-auto">
                <small class="uk-text-muted"
                  >max ${MAX_FLANK_BASES} bases</small
                >
              </div>
            </div>
          </div>
        </div>

        <div class="uk-margin">
          <button class="uk-button uk-button-default" type="submit">
            Search
          </button>
          <button
            class="uk-button uk-button-primary"
            type="button"
            ?disabled=${this._records.length === 0}
            @click=${() => this._download()}
          >
            Download sequence
          </button>
        </div>
      </form>

      <div class="uk-inline uk-width-1-1 uk-margin">
        <lis-loading-element
          ${ref(this._loadingRef)}
          dataType="sequences"
        ></lis-loading-element>
        <lis-simple-table-element
          caption=""
          .dataAttributes=${dataAttributes}
          .header=${header}
        ></lis-simple-table-element>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-retrieve-one-gene-sequence-element': LisRetrieveOneGeneSequenceElement;
  }
}
