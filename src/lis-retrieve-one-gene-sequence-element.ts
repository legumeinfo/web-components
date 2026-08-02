import {LitElement, css, html} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {LisCancelPromiseController} from './controllers';
import {LisLoadingElement, LisSimpleTableElement} from './core';
import {
  FastaRecord,
  MAX_FLANK_BASES,
  formatFasta,
  parseFasta,
} from './utils/sequence-fasta';

/**
 * Pull the `error` string out of a `{error, status}` JSON body that the
 * microservices return on 4xx/5xx. Best-effort: returns "" if the body isn't
 * JSON or doesn't have the expected shape.
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
 * Per-sequence-type download metadata, keyed by the sequence-type token that
 * the `sequences` service embeds as the second header token (`protein` / `cds`
 * / `genome`). Downloads are named `<id>.<label>.<ext>` (e.g.
 * `<gene>.protein.faa`), with the biologically-correct FASTA extension: `.faa`
 * (amino acid) for protein, `.fna` (nucleic acid) for the two nucleotide
 * outputs. The `label` token disambiguates the two `.fna` files from each other.
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
 * Function signature for fully overriding the backend call.
 *
 * Provided so consumers can swap in a mocked / pre-cached implementation
 * without re-deriving the element's form logic. When not set the element POSTs
 * to the configured `sequences` service.
 */
export type RetrieveOneGeneFunction = (
  searchData: RetrieveOneGeneSearchData,
  options: RetrieveOneGeneOptions,
) => Promise<FastaRecord[]>;

/**
 * Translate the mutually-exclusive sequence-type booleans into the `type` token
 * the `sequences` service expects.
 */
function sequenceType(
  data: RetrieveOneGeneSearchData,
): 'protein' | 'cds' | 'genome' {
  if (data.cds) return 'cds';
  if (data.genome) return 'genome';
  return 'protein';
}

/**
 * @htmlElement `<lis-retrieve-one-gene-sequence-element>`
 *
 * Component 1 of the LIS retrieve-sequence spec: given a single gene ID, fetch
 * its protein / CDS / genomic sequence and surface it as a table plus a
 * Download-as-FASTA action.
 *
 * The element now delegates all resolution to the `sequences` microservice — a
 * single GET to `/seq/{geneId}` returns the assembled FASTA, and the element
 * parses it for display and re-serializes it for download. Point it at your
 * service via {@link sequencesBase | `sequencesBase`} (default `/api/sequences`),
 * or replace the call entirely by assigning
 * {@link retrieveFunction | `retrieveFunction`}.
 *
 * @example
 * ```html
 * <lis-retrieve-one-gene-sequence-element
 *   id="retrieve"
 *   sequences-base="http://localhost:8082"
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

  /**
   * Base URL (or path) of the sequences service, no trailing slash. Defaults to
   * the gateway-mounted path `/api/sequences` (so requests go to
   * `/api/sequences/seq/...` on the same origin); set an absolute URL to hit the
   * service directly.
   */
  @property({type: String, attribute: 'sequences-base'})
  sequencesBase: string = '/api/sequences';

  /**
   * Optional override of the backend call. When unset the element GETs from the
   * `sequences` service at {@link sequencesBase | `sequencesBase`}.
   */
  @property({type: Function, attribute: false})
  retrieveFunction?: RetrieveOneGeneFunction;

  // Controller cancels any in-flight retrieve when the user re-submits or the
  // host element disconnects, so a slow request can't overwrite results from a
  // faster query the user just started.
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

  // Header strings produced by the `sequences` service embed the sequence type
  // as the second whitespace-delimited token; surface it as its own column so
  // the table reads like the spec's mockup without forcing callers to parse
  // FASTA headers themselves.
  private _typeFromHeader(header: string): string {
    const parts = header.split(/\s+/);
    return parts[1] ?? '';
  }

  // Downloads are split into one file per sequence type, named
  // `<gene>.<type>.<ext>` (e.g. `<gene>.protein.faa`, `<gene>.CDS.fna`,
  // `<gene>.genomic.fna`) so the user can tell the FASTAs apart and the
  // extension matches the sequence type. Records are grouped by type so this
  // stays correct even though a single query currently yields one type.
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

  // The built-in backend call: a single GET to the `sequences` service, which
  // resolves files/coordinates (via dscensor + genes), fetches the bytes (via
  // ds_utilities), reverse-complements minus-strand genomic slices, and returns
  // the assembled FASTA. The gene id is a single path segment (the service's GET
  // route is `/seq/{yucks}`, comma-separated; this element retrieves one gene).
  // The element parses that FASTA for display; download re-serializes the parsed
  // records. Consumers needing a different transport replace this via
  // `retrieveFunction`.
  private async _defaultRetrieve(
    data: RetrieveOneGeneSearchData,
    options: RetrieveOneGeneOptions,
  ): Promise<FastaRecord[]> {
    if (!this.sequencesBase) {
      throw new Error(
        'sequencesBase is not set — set the `sequences-base` attribute or the ' +
          '`sequencesBase` property on the element.',
      );
    }
    const params = new URLSearchParams({
      type: sequenceType(data),
      up: String(data.basesUpstream),
      down: String(data.basesDownstream),
    });
    const base = this.sequencesBase.replace(/\/$/, '');
    const url = `${base}/seq/${encodeURIComponent(data.geneId)}?${params}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {Accept: 'text/x-fasta'},
      signal: options.abortSignal,
    });
    if (!resp.ok) {
      const errMsg = await readErrorMessage(resp);
      throw new Error(
        `sequences /seq error: ${errMsg || `HTTP ${resp.status}`}`,
      );
    }
    return parseFasta(await resp.text());
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
