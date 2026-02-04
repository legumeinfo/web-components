import {LitElement, html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {live} from 'lit/directives/live.js';

import {LisCancelPromiseController} from './controllers';
import {LisLoadingElement, LisModalElement} from './core';

/**
 * The object describing a Variant Collection.
 */
export type VariantCollection = {
  name: string;
  collectionName: string;
  synopsis: string;
};

/**
 * A single Result from the Allele Search.
 */
export type AlleleSearchResult = {
  chrom: string;
  id: string;
  pos: number;
  ref: string;
  alts: string;
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
  },
  abortSignal?: AbortSignal,
) => Promise<AlleleSearchResult[]>;

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

@customElement('lis-allele-search-element')
export class LisAlleleSearchElement extends LitElement {
  /** @ignore */
  static override styles = css``;

  /** @ignore */
  override createRenderRoot() {
    return this;
  }

  // --- Properties ---

  /**
   * The list of available variant collections.
   */
  @property({type: Array})
  collections: VariantCollection[] = [];

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

  @state()
  private searchResults: AlleleSearchResult[] = [];

  @state()
  private searchedRegion: string = '';

  @state()
  private searchedTerm: string = '';

  // --- Controllers & Refs ---

  private cancelPromiseController = new LisCancelPromiseController(this);

  private _strainLoadingRef: Ref<LisLoadingElement> = createRef();
  private _modalRef: Ref<LisModalElement> = createRef();
  private _resultsLoadingRef: Ref<LisLoadingElement> = createRef();

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
    ).value;
    const flankInput = (
      this.renderRoot.querySelector('#flank-region') as HTMLInputElement
    ).value;
    // Basic validation
    if (!locationInput) return;

    this._toggleModal(true);
    this._resultsLoadingRef.value?.loading();
    this.searchResults = [];
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

    this._toggleModal(true);
    this._resultsLoadingRef.value?.loading();
    this.searchResults = [];
    this.searchedTerm = '';
    this.searchedRegion = `${chromInput}:${startInput}-${endInput}`;

    try {
      await this._performVariantSearch(
        chromInput,
        parseInt(startInput),
        parseInt(endInput),
      );
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
      },
      this.cancelPromiseController.abortSignal,
    );

    this.searchResults = results;
    if (results.length === 0) {
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
              Ref / Alt only</label
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
                <label class="uk-form-label">Flanking Region</label>
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
                  ${[
                    'Gm01',
                    'Gm02',
                    'Gm03',
                    'Gm04',
                    'Gm05',
                    'Gm06',
                    'Gm07',
                    'Gm08',
                    'Gm09',
                    'Gm10',
                    'Gm11',
                    'Gm12',
                    'Gm13',
                    'Gm14',
                    'Gm15',
                    'Gm16',
                    'Gm17',
                    'Gm18',
                    'Gm19',
                    'Gm20',
                  ].map((c) => html`<option>${c}</option>`)}
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
          <div class="uk-margin-bottom">
            <div>
              <strong>Identifier:</strong> ${this.searchedTerm || 'N/A'}
            </div>
            <div><strong>Region:</strong> ${this.searchedRegion}</div>
          </div>

          <lis-loading-element
            ${ref(this._resultsLoadingRef)}
          ></lis-loading-element>

          <lis-simple-table-element
            .dataAttributes=${['chrom', 'id', 'pos', 'ref', 'alts']}
            .header=${{
              chrom: 'Chromosome',
              id: 'Variant ID',
              pos: 'Position',
              ref: 'Ref',
              alts: 'Alt',
            }}
            .data=${this.searchResults}
          ></lis-simple-table-element>
        </lis-modal-element>
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
