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
  bed_url: string | null;
  genome_url: string | null;
  genus?: string | null;
  species?: string | null;
  infraspecies?: string | null;
};

/** One row from ds_utilities `/bed/lookup`. */
export type RetrieveSequenceBedRow = {
  molecule: string;
  start: number;
  end: number;
  mrna_id: string;
  score: number;
  strand: string;
  gene_id: string;
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
 * a Download-as-FASTA action. Out of the box it talks to a dscensor instance
 * and a ds_utilities instance over HTTP — set
 * {@link dscensorBase | `dscensorBase`} and
 * {@link dsUtilitiesBase | `dsUtilitiesBase`} to point at your services, or
 * replace the whole chain by assigning
 * {@link retrieveFunction | `retrieveFunction`}.
 *
 * @example
 * ```html
 * <lis-retrieve-one-gene-sequence-element
 *   id="retrieve"
 *   dscensorBase="http://localhost:8765"
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
  @state() private _protein: boolean = false;
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
    if (data?.protein !== undefined) this._protein = data.protein;
    if (data?.cds !== undefined) this._cds = data.cds;
    if (data?.genome !== undefined) this._genome = data.genome;
    if (data?.basesUpstream !== undefined)
      this._basesUpstream = String(data.basesUpstream);
    if (data?.basesDownstream !== undefined)
      this._basesDownstream = String(data.basesDownstream);
    this._submit();
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

  private _download(): void {
    if (this._records.length === 0) return;
    const fasta = formatFasta(this._records);
    const blob = new Blob([fasta], {type: 'text/x-fasta'});
    const url = URL.createObjectURL(blob);
    const filename =
      this._geneId.replace(/[^A-Za-z0-9._-]+/g, '_') || 'sequence';
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.fa`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // The built-in chain: dscensor /files/{prefix} → ds_utilities /bed/lookup
  // (longest=true) → ds_utilities /fasta/fetch per requested sequence type.
  // Kept inside the element so the spec's flow Just Works against the default
  // localhost ports; consumers needing a different transport replace this via
  // `retrieveFunction`.
  private async _defaultRetrieve(
    data: RetrieveOneGeneSearchData,
    options: RetrieveOneGeneOptions,
  ): Promise<FastaRecord[]> {
    const signal = options.abortSignal;
    const prefix = extractFullYuckPrefix(data.geneId);
    const files = await this._fetchFiles(prefix, signal);
    if (!files.bed_url) {
      throw new Error(
        `dscensor catalog has no bed_url for prefix "${prefix}"; ` +
          `cannot resolve mRNA IDs.`,
      );
    }
    // longest=true → the BED-lookup returns a one-element list (or 404, which
    // surfaces as a thrown Error below). We pick the longest variant so the
    // single-gene view shows one canonical mRNA without forcing the user to
    // choose, per Steven's "return one" mode.
    const row = await this._fetchLongestBedRow(
      data.geneId,
      files.bed_url,
      signal,
    );
    const records: FastaRecord[] = [];
    if (data.protein) {
      if (!files.protein_url) {
        throw new Error(
          `dscensor catalog has no protein_url for prefix "${prefix}".`,
        );
      }
      const seq = await this._fetchFasta(
        row.mrna_id,
        files.protein_url,
        signal,
      );
      records.push({
        header: `${row.mrna_id} protein gene=${data.geneId}`,
        sequence: seq,
      });
    }
    if (data.cds) {
      if (!files.cds_url) {
        throw new Error(
          `dscensor catalog has no cds_url for prefix "${prefix}".`,
        );
      }
      const seq = await this._fetchFasta(row.mrna_id, files.cds_url, signal);
      records.push({
        header: `${row.mrna_id} cds gene=${data.geneId}`,
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

  private async _fetchLongestBedRow(
    geneId: string,
    bedUrl: string,
    signal?: AbortSignal,
  ): Promise<RetrieveSequenceBedRow> {
    const url =
      `${this.dsUtilitiesBase}/bed/lookup/` +
      `${encodeURIComponent(geneId)}/${encodeURIComponent(bedUrl)}` +
      `?longest=true`;
    const resp = await fetch(url, {signal});
    if (resp.status === 404) {
      throw new Error(
        `No mRNA rows found for gene "${geneId}" in the annotation BED.`,
      );
    }
    if (!resp.ok) {
      // pysam.TabixFile.__cinit__ surfaces "could not open file" when the
      // sibling .tbi (or .csi) index is missing on the remote BED — distinct
      // from a transient HTTP error. Detect it so the user sees a data-gap
      // hint rather than a generic 400.
      const errMsg = await readErrorMessage(resp);
      if (looksLikeMissingPysamIndex(errMsg)) {
        const filename = lastUrlSegment(bedUrl);
        throw new Error(
          `The annotation BED at "${filename}" is reachable but its tabix ` +
            `index (.tbi) is missing — pysam can't open the file without ` +
            `it. This is a data-side gap; the LIS data team needs to ` +
            `generate the index. Other assemblies should still work.`,
        );
      }
      throw new Error(
        `ds_utilities /bed/lookup error: ${errMsg || `HTTP ${resp.status}`}`,
      );
    }
    const rows = (await resp.json()) as RetrieveSequenceBedRow[];
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error(
        `No mRNA rows found for gene "${geneId}" in the annotation BED.`,
      );
    }
    return rows[0];
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
      // Same pysam failure shape as bed_lookup: a missing .fai / .gzi sibling
      // on the FASTA produces "could not open file" rather than a transient
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
    row: RetrieveSequenceBedRow,
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
    const region = `${row.molecule}:${fetchStart}-${fetchEnd}`;
    const url =
      `${this.dsUtilitiesBase}/fasta/fetch/` +
      `${encodeURIComponent(region)}/${encodeURIComponent(genomeUrl)}`;
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
              class="uk-checkbox"
              type="checkbox"
              .checked=${this._protein}
              @change=${(e: Event) =>
                (this._protein = (e.target as HTMLInputElement).checked)}
            />
            Protein sequence
          </label>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label">
            <input
              class="uk-checkbox"
              type="checkbox"
              .checked=${this._cds}
              @change=${(e: Event) =>
                (this._cds = (e.target as HTMLInputElement).checked)}
            />
            CDS sequence
          </label>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label">
            <input
              class="uk-checkbox"
              type="checkbox"
              .checked=${this._genome}
              @change=${(e: Event) =>
                (this._genome = (e.target as HTMLInputElement).checked)}
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
