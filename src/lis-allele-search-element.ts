import {LitElement, html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {live} from 'lit/directives/live.js';

import {LisCancelPromiseController} from './controllers';
import {
  LisInlineLoadingElement,
  LisLoadingElement,
  LisModalElement,
} from './core';

/**
 * The object describing a Variant Collection.
 */
export type VariantCollection = {
  name: string;
  collectionName: string;
  synopsis: string;
};

/**
 * Encoding for allele genotype display: VCF (e.g. 0/0, 1/1) or HapMap (e.g. TT, CC).
 */
export type AlleleEncoding = 'vcf' | 'hap';

/**
 * One variant from the alleles API with genotypes per sample.
 */
export type AlleleVariant = {
  position: number;
  ref: string;
  alt: string;
  genotypes: Record<string, string>;
};

/**
 * Response from the /vcf/alleles/ API.
 */
export type AlleleVariantsResponse = {
  region: {chromosome: string; start: number; end: number};
  encoding: AlleleEncoding;
  samples: string[];
  invalid_samples?: string[];
  variant_count: number;
  variants: AlleleVariant[];
};

/**
 * Data needed to search for genes to get coordinates.
 */
export type AlleleLocationSearchFunction = (
  identifier: string,
  abortSignal?: AbortSignal,
) => Promise<{chromosome: string; start: number; end: number}>;

/**
 * Data needed to search for variants.
 */
export type AlleleVariantSearchFunction = (
  params: {
    collection: string;
    fileName: string;
    chromosome: string;
    start: number;
    end: number;
    strains?: string[];
    encoding?: AlleleEncoding;
  },
  abortSignal?: AbortSignal,
) => Promise<AlleleVariantsResponse>;

/**
 * Function to fetch strains for a collection.
 */
export type AlleleStrainSearchFunction = (
  params: {
    collection: string;
    fileName: string;
  },
  abortSignal?: AbortSignal,
) => Promise<{identifier: string}[]>;

/**
 * Function to download allele data as a file.
 * Should fetch the data and trigger a file download.
 */
export type AlleleDownloadFunction = (
  params: {
    collection: string;
    fileName: string;
    chromosome: string;
    start: number;
    end: number;
    strains?: string[];
    encoding?: AlleleEncoding;
  },
  abortSignal?: AbortSignal,
) => Promise<void>;

const MAX_REGION_SIZE = 1_000_000;

@customElement('lis-allele-search-element')
export class LisAlleleSearchElement extends LitElement {
  /** @ignore */
  static override styles = css``;

  /** @ignore */
  override createRenderRoot() {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const dataAttr = this.getAttribute('data-collections');
    if (dataAttr) {
      try {
        const parsed = JSON.parse(dataAttr);
        if (Array.isArray(parsed)) {
          this.collections = parsed;
        }
      } catch (e) {
        console.error('Failed to parse data-collections attribute', e);
      }
    }

    const chromosomesAttr = this.getAttribute('data-chromosomes');
    if (chromosomesAttr) {
      try {
        const parsed = JSON.parse(chromosomesAttr);
        if (Array.isArray(parsed)) {
          this.chromosomes = parsed;
        }
      } catch (e) {
        console.error('Failed to parse data-chromosomes attribute', e);
      }
    }
  }

  // --- Properties ---

  /**
   * The list of available variant collections.
   */
  @property({type: Array})
  collections: VariantCollection[] = [];

  /**
   * The list of available chromosome identifiers for region search.
   */
  @property({type: Array})
  chromosomes: string[] = [];

  /**
   * The name of the collection to select by default.
   */
  @property({type: String})
  preSelectedCollection?: string;

  /**
   * Function to resolve a gene name to coordinates.
   */
  @property({attribute: false})
  locationSearchFunction: AlleleLocationSearchFunction = () =>
    Promise.reject('No location search function');

  /**
   * Function to fetch variants.
   */
  @property({attribute: false})
  variantSearchFunction: AlleleVariantSearchFunction = () =>
    Promise.reject('No variant search function');

  /**
   * Function to fetch strains.
   */
  @property({attribute: false})
  strainSearchFunction: AlleleStrainSearchFunction = () =>
    Promise.reject('No strain search function');

  /**
   * Function to download allele data as a file.
   */
  @property({attribute: false})
  downloadFunction?: AlleleDownloadFunction;

  // --- State ---

  @state()
  private selectedCollectionIdx: number = -1;

  @state()
  private strainMode: 'ref-alt' | 'specific-strain' = 'ref-alt';

  @state()
  private availableStrains: {identifier: string}[] = [];

  @state()
  private selectedStrains: string[] = [];

  @state()
  private strainFilter: string = '';

  /** Display encoding: hap or vcf. Default hap. */
  @state()
  private encoding: AlleleEncoding = 'hap';

  @state()
  private searchResults: AlleleVariantsResponse | null = null;

  @state()
  private searchedRegion: string = '';

  @state()
  private searchedTerm: string = '';

  // --- Controllers & Refs ---

  private cancelPromiseController = new LisCancelPromiseController(this);

  private _strainLoadingRef: Ref<LisLoadingElement> = createRef();
  private _modalRef: Ref<LisModalElement> = createRef();
  private _resultsLoadingRef: Ref<LisLoadingElement> = createRef();
  private _downloadLoadingRef: Ref<LisInlineLoadingElement> = createRef();

  // --- Lifecycle ---

  override willUpdate(changedProperties: Map<string, unknown>) {
    if (
      changedProperties.has('collections') ||
      changedProperties.has('preSelectedCollection')
    ) {
      if (this.collections.length > 0 && this.selectedCollectionIdx === -1) {
        if (this.preSelectedCollection) {
          this.selectedCollectionIdx = this.collections.findIndex(
            (c) => c.collectionName === this.preSelectedCollection,
          );
        }
        if (this.selectedCollectionIdx === -1) {
          this.selectedCollectionIdx = 0;
        }
      }
    }
  }

  // --- Event Handlers ---

  private _onCollectionChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.selectedCollectionIdx = target.selectedIndex;
    // Reset strains
    this.availableStrains = [];
    this.selectedStrains = [];
    if (this.strainMode === 'specific-strain') {
      this._fetchStrains();
    }
  }

  private _onStrainModeChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.strainMode = target.value as any;
    if (
      this.strainMode === 'specific-strain' &&
      this.availableStrains.length === 0
    ) {
      this._fetchStrains();
    }
  }

  private _onStrainFilter(e: Event) {
    this.strainFilter = (e.target as HTMLInputElement).value;
  }

  private _onStrainSelect(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.selectedStrains = Array.from(target.selectedOptions).map(
      (o) => o.value,
    );
  }

  private _onEncodingChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.encoding = target.value as AlleleEncoding;
  }

  private async _fetchStrains() {
    const collection = this.collections[this.selectedCollectionIdx];
    if (!collection) return;

    this.cancelPromiseController.cancel();
    this._strainLoadingRef.value?.loading();

    try {
      const strains = await this.strainSearchFunction(
        {collection: collection.collectionName, fileName: collection.name},
        this.cancelPromiseController.abortSignal,
      );
      this.availableStrains = strains;
      this._strainLoadingRef.value?.success();
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        this._strainLoadingRef.value?.failure();
        console.error(error);
      }
    }
  }

  private async _onSearchLocation() {
    const locationInput = (
      this.renderRoot.querySelector('#location-id') as HTMLInputElement
    ).value.trim();
    const flankInput = (
      this.renderRoot.querySelector('#flank-region') as HTMLInputElement
    ).value;
    // Basic validation
    if (!locationInput) return;

    this._toggleModal(true);
    this._resultsLoadingRef.value?.loading();
    this.searchResults = null;
    this.searchedTerm = locationInput;
    this.searchedRegion = '';

    try {
      // 1. Resolve Location
      const geneLoc = await this.locationSearchFunction(
        locationInput,
        this.cancelPromiseController.abortSignal,
      );

      const {chromosome} = geneLoc;
      let {start, end} = geneLoc;
      const flank = parseInt(flankInput) || 0;
      start = Math.max(0, start - flank);
      end = end + flank;

      if (end - start > MAX_REGION_SIZE) {
        this._resultsLoadingRef.value?.error(
          `Region too large; maximum span is ${MAX_REGION_SIZE.toLocaleString()} bases.`,
        );
        return;
      }

      this.searchedRegion = `${chromosome}:${start}-${end}`;

      // 2. Fetch Variants
      await this._performVariantSearch(chromosome, start, end);
    } catch (error) {
      this._resultsLoadingRef.value?.error('Search failed: ' + error);
    }
  }

  private async _onSearchRegion() {
    const chromInput = (
      this.renderRoot.querySelector('#chromosome-select') as HTMLSelectElement
    ).value;
    const startInput = (
      this.renderRoot.querySelector('#genomic-region-start') as HTMLInputElement
    ).value;
    const endInput = (
      this.renderRoot.querySelector('#genomic-region-end') as HTMLInputElement
    ).value;

    if (!chromInput || !startInput || !endInput) return;

    const start = parseInt(startInput);
    const end = parseInt(endInput);

    if (isNaN(start) || isNaN(end) || end <= start) {
      return;
    }

    if (end - start > MAX_REGION_SIZE) {
      this._toggleModal(true);
      this._resultsLoadingRef.value?.error(
        `Region too large; maximum span is ${MAX_REGION_SIZE.toLocaleString()} bases.`,
      );
      return;
    }

    this._toggleModal(true);
    this._resultsLoadingRef.value?.loading();
    this.searchResults = null;
    this.searchedTerm = '';
    this.searchedRegion = `${chromInput}:${start}-${end}`;

    try {
      await this._performVariantSearch(chromInput, start, end);
    } catch (error) {
      this._resultsLoadingRef.value?.error('Search failed: ' + error);
    }
  }

  private async _performVariantSearch(
    chromosome: string,
    start: number,
    end: number,
  ) {
    const collection = this.collections[this.selectedCollectionIdx];

    // Match check logic from original, might need to move this to the search function.

    const results = await this.variantSearchFunction(
      {
        collection: collection.collectionName,
        fileName: collection.name,
        chromosome,
        start,
        end,
        strains:
          this.strainMode === 'specific-strain'
            ? this.selectedStrains
            : undefined,
        encoding: this.encoding,
      },
      this.cancelPromiseController.abortSignal,
    );

    this.searchResults = results;
    if (results.variant_count === 0) {
      this._resultsLoadingRef.value?.noResults();
    } else {
      this._resultsLoadingRef.value?.success();
    }
  }

  private _toggleModal(open: boolean) {
    const modalElement = this._modalRef.value?.renderRoot.firstElementChild;
    if (modalElement && (window as any).UIkit) {
      if (open) {
        (window as any).UIkit.modal(modalElement).show();
      } else {
        (window as any).UIkit.modal(modalElement).hide();
      }
    }
  }

  private async _downloadResults() {
    if (!this.downloadFunction || !this.searchResults) return;

    const selectedCollection = this.collections[this.selectedCollectionIdx];
    if (!selectedCollection) return;

    // Parse the searched region to get chromosome, start, end
    const regionMatch = this.searchedRegion.match(/(.+):(\d+)-(\d+)/);
    if (!regionMatch) return;

    const [, chromosome, startStr, endStr] = regionMatch;
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);

    this._downloadLoadingRef.value?.loading();

    try {
      await this.downloadFunction(
        {
          collection: selectedCollection.collectionName,
          fileName: selectedCollection.name,
          chromosome,
          start,
          end,
          strains:
            this.selectedStrains.length > 0 ? this.selectedStrains : undefined,
          encoding: this.encoding,
        },
        this.cancelPromiseController.abortSignal,
      );
      this._downloadLoadingRef.value?.success();
    } catch (error) {
      if (!(error instanceof Event && error.type === 'abort')) {
        this._downloadLoadingRef.value?.failure();
      }
    }
  }

  // --- Render ---

  override render() {
    const selectedCollection = this.collections[this.selectedCollectionIdx];

    return html`
      <div class="uk-container">
        <!-- Collection Select -->
        <div class="uk-margin">
          <label class="uk-form-label uk-text-bold"
            >Step 1. Select a variant collection.</label
          >
          <div class="uk-margin-small-top">
            <select
              class="uk-select uk-form-width-large"
              @change=${this._onCollectionChange}
              .selectedIndex=${live(this.selectedCollectionIdx)}
            >
              ${this.collections.map(
                (c) =>
                  html`<option value="${c.collectionName}">
                    ${c.collectionName}
                  </option>`,
              )}
            </select>
          </div>
          <p class="uk-text-meta">
            Synopsis: ${selectedCollection?.synopsis || 'N/A'}
          </p>
        </div>

        <!-- Strain Select -->
        <div class="uk-margin">
          <label class="uk-form-label uk-text-bold"
            >Step 1.5. Select strain analysis type:</label
          >
          <div class="uk-margin-small-top">
            <label
              ><input
                class="uk-radio"
                type="radio"
                name="strain-type"
                value="ref-alt"
                ?checked=${this.strainMode === 'ref-alt'}
                @change=${this._onStrainModeChange}
              />
              All strains</label
            >
            <label class="uk-margin-left"
              ><input
                class="uk-radio"
                type="radio"
                name="strain-type"
                value="specific-strain"
                ?checked=${this.strainMode === 'specific-strain'}
                @change=${this._onStrainModeChange}
              />
              Specific strain</label
            >
          </div>

          ${this.strainMode === 'specific-strain'
            ? this._renderStrainSelector()
            : ''}
        </div>

        <!-- Encoding: VCF vs HapMap -->
        <div class="uk-margin">
          <label class="uk-form-label uk-text-bold">Genotype display:</label>
          <div class="uk-margin-small-top">
            <label
              ><input
                class="uk-radio"
                type="radio"
                name="encoding"
                value="hap"
                ?checked=${this.encoding === 'hap'}
                @change=${this._onEncodingChange}
              />
              HapMap</label
            >
            <label class="uk-margin-left"
              ><input
                class="uk-radio"
                type="radio"
                name="encoding"
                value="vcf"
                ?checked=${this.encoding === 'vcf'}
                @change=${this._onEncodingChange}
              />
              VCF</label
            >
          </div>
          <p class="uk-text-meta">
            VCF encodes data as reference-relative states (0/1), while HapMap
            reports the specific observed nucleotides directly (e.g., A, G).
          </p>
        </div>

        <hr />

        <!-- Search Forms -->
        <!-- Search Forms -->
        <div class="uk-margin">
          <!-- By Features -->
          <div class="uk-card uk-card-default uk-card-body uk-margin-bottom">
            <h3 class="uk-card-title">Step 2. Search by Identifier</h3>
            <div class="uk-grid-small uk-child-width-expand@s" uk-grid>
              <div>
                <label class="uk-form-label">Identifier</label>
                <input
                  id="location-id"
                  class="uk-input"
                  type="text"
                  placeholder="Enter identifier"
                />
                <div class="uk-text-meta">
                  e.g. glyma.Wm82.gnm4.ann1.Glyma.16G040000
                </div>
              </div>
              <div class="uk-width-1-3@s">
                <label class="uk-form-label"
                  >Flanking Region (1 million max)</label
                >
                <input
                  id="flank-region"
                  class="uk-input"
                  type="number"
                  placeholder="Flank"
                  value="0"
                />
                <div class="uk-text-meta">e.g. 50000</div>
              </div>
            </div>
            <button
              class="uk-button uk-button-primary uk-margin-top"
              @click=${this._onSearchLocation}
            >
              Search
            </button>
          </div>

          <!-- By Region -->
          <div class="uk-card uk-card-default uk-card-body">
            <h3 class="uk-card-title">Or Search by Genomic Region</h3>
            <div class="uk-grid-small uk-flex-middle" uk-grid>
              <div class="uk-width-auto">
                <label class="uk-form-label">Chr</label>
                <select
                  id="chromosome-select"
                  class="uk-select uk-form-width-small"
                >
                  ${this.chromosomes.map((c) => html`<option>${c}</option>`)}
                </select>
              </div>
              <div class="uk-width-expand">
                <label class="uk-form-label">Start</label>
                <input
                  id="genomic-region-start"
                  class="uk-input"
                  type="number"
                  placeholder="Start"
                />
                <div class="uk-text-meta">e.g. 10000</div>
              </div>
              <div class="uk-width-expand">
                <label class="uk-form-label">End</label>
                <input
                  id="genomic-region-end"
                  class="uk-input"
                  type="number"
                  placeholder="End"
                />
                <div class="uk-text-meta">e.g. 50000</div>
              </div>
            </div>
            <button
              class="uk-button uk-button-primary uk-margin-top"
              @click=${this._onSearchRegion}
            >
              Search Region
            </button>
          </div>
        </div>

        <!-- Results Modal -->
        <lis-modal-element
          ${ref(this._modalRef)}
          modalId="allele-search-modal"
          modalOptions="container: false"
          heading="Allele Search Results"
        >
          <div>
            <div class="uk-margin-bottom">
              <div>
                <strong>Identifier:</strong> ${this.searchedTerm || 'N/A'}
              </div>
              <div><strong>Region:</strong> ${this.searchedRegion}</div>
            </div>

            <div class="uk-inline uk-width-1-1">
              <lis-loading-element
                ${ref(this._resultsLoadingRef)}
              ></lis-loading-element>

              ${this._renderAlleleVariantsTable(this.searchResults)}
            </div>

            <div
              class="uk-margin-top"
              style="${this.downloadFunction &&
              this.searchResults?.variants?.length
                ? ''
                : 'display: none;'}"
            >
              <button
                type="button"
                class="uk-button uk-button-default"
                @click=${this._downloadResults}
              >
                Download
              </button>
              <lis-inline-loading-element
                ${ref(this._downloadLoadingRef)}
              ></lis-inline-loading-element>
            </div>
          </div>
        </lis-modal-element>
      </div>
    `;
  }

  private _renderAlleleVariantsTable(response: AlleleVariantsResponse | null) {
    const variants = Array.isArray(response?.variants)
      ? response!.variants
      : [];
    const samples = Array.isArray(response?.samples) ? response!.samples : [];

    const dataAttributes: string[] = ['position', 'ref', 'alt', ...samples];
    const header: Record<string, string> = {
      position: 'Position',
      ref: 'Ref',
      alt: 'Alt',
    };
    samples.forEach((s) => {
      header[s] = s;
    });

    const data = variants.map((v) => {
      const row: {[key: string]: string} = {
        position: v.position != null ? String(v.position) : '',
        ref: v.ref ?? '',
        alt: v.alt ?? '',
      };

      samples.forEach((sample) => {
        const g = v.genotypes ? v.genotypes[sample] : undefined;
        row[sample] = g != null ? String(g) : '';
      });

      return row;
    });

    // Render table
    return html`
      <div class="uk-overflow-auto">
        <lis-simple-table-element
          .dataAttributes=${dataAttributes}
          .header=${header}
          .data=${data}
        ></lis-simple-table-element>
      </div>
    `;
  }

  private _renderStrainSelector() {
    const filteredStrains = this.availableStrains
      .filter((s) =>
        s.identifier.toLowerCase().includes(this.strainFilter.toLowerCase()),
      )
      .slice(0, 500); // Limit render

    return html`
      <div
        class="uk-margin-top uk-card uk-card-default uk-card-body uk-padding-small"
      >
        <lis-loading-element
          ${ref(this._strainLoadingRef)}
        ></lis-loading-element>
        <input
          class="uk-input uk-margin-small-bottom"
          type="text"
          placeholder="Filter strains..."
          @input=${this._onStrainFilter}
        />
        <select
          class="uk-select"
          multiple
          size="10"
          @change=${this._onStrainSelect}
        >
          ${filteredStrains.map(
            (s) =>
              html`<option value="${s.identifier}">${s.identifier}</option>`,
          )}
        </select>
        <div class="uk-text-meta uk-margin-small-top">
          ${filteredStrains.length} / ${this.availableStrains.length} strains
          shown
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-allele-search-element': LisAlleleSearchElement;
  }
}
