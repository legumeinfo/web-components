import {LitElement, css, html} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {LisCancelPromiseController} from './controllers';
import {LisLoadingElement, LisSimpleTableElement} from './core';
import {
  FastaRecord,
  MAX_FLANK_BASES,
  formatFasta,
} from './utils/sequence-fasta';

/**
 * Resolves each requested gene's sequence. Genes absent from the mine, or
 * lacking the requested type, come back absent / null.
 */
const GET_SEQUENCES_QUERY = `query GetSequences(
  $identifiers: [ID!]!
  $type: SequenceType!
  $up: Int!
  $down: Int!
) {
  getGenes(identifiers: $identifiers) {
    results {
      identifier
      retrievedSequence(type: $type, up: $up, down: $down) {
        length
        md5checksum
        residues
      }
    }
  }
}`;

/**
 * Download metadata per sequence type (keyed by the header's second token).
 * Files are named `<id>.<label>.<ext>`: `.faa` for protein, `.fna` for the two
 * nucleotide types (`label` tells them apart).
 */
const DOWNLOAD_TYPE_META: Record<string, {label: string; ext: string}> = {
  protein: {label: 'protein', ext: 'faa'},
  cds: {label: 'CDS', ext: 'fna'},
  genome: {label: 'genomic', ext: 'fna'},
};

/**
 * Form data submitted on SEARCH. `geneIds` is the parsed ID list; flanks apply
 * only when `genome`, pre-clamped to [0, MAX_FLANK_BASES].
 */
export type RetrieveSequenceSearchData = {
  geneIds: string[];
  protein: boolean;
  cds: boolean;
  genome: boolean;
  basesUpstream: number;
  basesDownstream: number;
};

/** Optional parameters passed alongside the form data. */
export type RetrieveSequenceOptions = {abortSignal?: AbortSignal};

/**
 * Overrides the backend call (e.g. a mock). Unset, the element POSTs the
 * `getGenes { retrievedSequence }` query to the GraphQL server.
 */
export type RetrieveSequenceFunction = (
  searchData: RetrieveSequenceSearchData,
  options: RetrieveSequenceOptions,
) => Promise<FastaRecord[]>;

/** The selected type token from the mutually-exclusive type flags. */
function sequenceType(
  data: RetrieveSequenceSearchData,
): 'protein' | 'cds' | 'genome' {
  if (data.cds) return 'cds';
  if (data.genome) return 'genome';
  return 'protein';
}

/**
 * @htmlElement `<lis-retrieve-sequence-element>`
 *
 * Component 1 of the LIS retrieve-sequence spec: given one or more gene IDs,
 * fetch each gene's protein / CDS / genomic sequence and surface them as a
 * table plus a Download-as-FASTA action.
 *
 * Resolves sequences via a single `getGenes { retrievedSequence }` query to the
 * LIS GraphQL server ({@link graphqlEndpoint | `graphqlEndpoint`}); override the
 * call with {@link retrieveFunction | `retrieveFunction`}.
 *
 * @example
 * ```html
 * <lis-retrieve-sequence-element
 *   id="retrieve"
 *   graphql-endpoint="http://localhost:4000/graphql"
 * ></lis-retrieve-sequence-element>
 * ```
 */
@customElement('lis-retrieve-sequence-element')
export class LisRetrieveSequenceElement extends LitElement {
  /** @ignore */
  static override styles = css``;

  /** @ignore */
  // Disable Shadow DOM to inherit the page's UIKit styles.
  override createRenderRoot() {
    return this;
  }

  /**
   * GraphQL endpoint URL. Defaults to `/api/graphql` on the same origin; set an
   * absolute URL to hit a server directly.
   */
  @property({type: String, attribute: 'graphql-endpoint'})
  graphqlEndpoint: string = '/api/graphql';

  /** Optional override of the backend call — see {@link RetrieveSequenceFunction}. */
  @property({type: Function, attribute: false})
  retrieveFunction?: RetrieveSequenceFunction;

  // Cancels an in-flight retrieve on re-submit / disconnect so a slow response
  // can't overwrite newer results.
  protected cancelPromiseController = new LisCancelPromiseController(this);

  @state() private _geneIds: string = '';
  @state() private _protein: boolean = true;
  @state() private _cds: boolean = false;
  @state() private _genome: boolean = false;
  @state() private _basesUpstream: string = '0';
  @state() private _basesDownstream: string = '0';
  @state() private _records: FastaRecord[] = [];

  @query('lis-simple-table-element') private _table!: LisSimpleTableElement;
  private _loadingRef: Ref<LisLoadingElement> = createRef();

  /** Trigger a retrieve from outside the form (e.g. `window.onload` demos). */
  public retrieve(data?: Partial<RetrieveSequenceSearchData>): void {
    if (data?.geneIds !== undefined) this._geneIds = data.geneIds.join('\n');
    // Exclusive type: later selections win (protein → cds → genome).
    if (data?.protein) this._selectSequenceType('protein');
    if (data?.cds) this._selectSequenceType('cds');
    if (data?.genome) this._selectSequenceType('genome');
    if (data?.basesUpstream !== undefined)
      this._basesUpstream = String(data.basesUpstream);
    if (data?.basesDownstream !== undefined)
      this._basesDownstream = String(data.basesDownstream);
    this._submit();
  }

  // Exclusive selection: exactly one type flag is ever true.
  private _selectSequenceType(type: 'protein' | 'cds' | 'genome'): void {
    this._protein = type === 'protein';
    this._cds = type === 'cds';
    this._genome = type === 'genome';
  }

  // Split the ID field on whitespace/commas, de-duplicated.
  private _parseGeneIds(): string[] {
    const seen = new Set<string>();
    for (const id of this._geneIds.split(/[\s,]+/)) {
      const trimmed = id.trim();
      if (trimmed) seen.add(trimmed);
    }
    return [...seen];
  }

  private _searchData(): RetrieveSequenceSearchData {
    return {
      geneIds: this._parseGeneIds(),
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
    if (data.geneIds.length === 0) {
      this._loadingRef.value?.error(
        'Enter at least one gene ID before searching.',
      );
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

  // The type is the header's second whitespace token; surface it as a column.
  private _typeFromHeader(header: string): string {
    const parts = header.split(/\s+/);
    return parts[1] ?? '';
  }

  // One FASTA file per sequence type, named `<base>.<label>.<ext>`.
  private _download(): void {
    if (this._records.length === 0) return;
    // single gene → name after it; multiple → generic prefix
    const ids = this._parseGeneIds();
    const base =
      ids.length === 1
        ? ids[0].replace(/[^A-Za-z0-9._-]+/g, '_') || 'sequence'
        : 'sequences';
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

  // Built-in backend: POST the `getGenes { retrievedSequence }` query to the
  // GraphQL server. Genes absent from the mine, or lacking the requested type,
  // are dropped. Override via `retrieveFunction`.
  private async _defaultRetrieve(
    data: RetrieveSequenceSearchData,
    options: RetrieveSequenceOptions,
  ): Promise<FastaRecord[]> {
    if (!this.graphqlEndpoint) {
      throw new Error(
        'graphqlEndpoint is not set — set the `graphql-endpoint` attribute or ' +
          'the `graphqlEndpoint` property on the element.',
      );
    }
    const type = sequenceType(data);
    // flanks are genome-only
    const genome = type === 'genome';
    const variables = {
      identifiers: data.geneIds,
      type: type.toUpperCase(),
      up: genome ? data.basesUpstream : 0,
      down: genome ? data.basesDownstream : 0,
    };
    const resp = await fetch(this.graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({query: GET_SEQUENCES_QUERY, variables}),
      signal: options.abortSignal,
    });
    if (!resp.ok) {
      throw new Error(`GraphQL request failed: HTTP ${resp.status}`);
    }
    const body = (await resp.json()) as {
      data?: {
        getGenes?: {
          results?: Array<{
            identifier: string;
            retrievedSequence: {residues: string} | null;
          }>;
        };
      };
      errors?: Array<{message: string}>;
    };
    if (body.errors?.length) {
      throw new Error(body.errors.map((e) => e.message).join('; '));
    }
    // one record per resolved gene; header's second token is the type
    const results = body.data?.getGenes?.results ?? [];
    const records: FastaRecord[] = [];
    for (const gene of results) {
      const residues = gene.retrievedSequence?.residues;
      if (!residues) continue;
      records.push({header: `${gene.identifier} ${type}`, sequence: residues});
    }
    return records;
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
        <legend class="uk-legend">Retrieve sequences by gene ID</legend>

        <div class="uk-margin">
          <textarea
            class="uk-textarea"
            rows="3"
            placeholder="Gene IDs (one per line, or separated by spaces/commas)"
            .value=${this._geneIds}
            @input=${(e: Event) =>
              (this._geneIds = (e.target as HTMLTextAreaElement).value)}
          ></textarea>
          <small class="uk-text-muted">
            e.g., glyma.Wm82.gnm2.ann1.Glyma.08G002000
            glyma.Wm82.gnm2.ann1.Glyma.08G003000
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
    'lis-retrieve-sequence-element': LisRetrieveSequenceElement;
  }
}
