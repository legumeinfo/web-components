import {LitElement, css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {LisPaginatedSearchMixin, PaginatedSearchOptions} from './mixins';
import {LisCancelPromiseController} from './controllers';
import {LisLoadingElement} from './core';
import {LisLinkoutElement, LinkoutFunction} from './lis-linkout-element';
import {StringObjectModel} from './models';
import {createRef, ref, Ref} from 'lit/directives/ref.js';
import {live} from 'lit/directives/live.js';

/**
 * The data used to construct the search form in the
 * {@link LisGeneFunctionSearchElement | `LisGeneFunctionSearchElement`} template.
 */
export type GeneFunctionSearchFormData = {
  genuses: {
    genus: string;
    species: {
      species: string;
    }[];
  }[];
};

/**
 * Optional parameters that may be given to a form data function. The
 * {@link !AbortSignal | `AbortSignal`} instance will emit if a new function is provided
 * before the current function completes. This signal should be used to cancel in-flight
 * requests if the external API supports it.
 */
export type GeneFunctionSearchFormDataOptions = {abortSignal?: AbortSignal};

/**
 * The type signature of a function that may be used to load the data used to construct
 * the search form in the {@link LisGeneFunctionSearchElement | `LisGeneFunctionSearchElement`}
 * template.
 */
export type GeneFunctionFormDataFunction = (
  options: GeneFunctionSearchFormDataOptions,
) => Promise<GeneFunctionSearchFormData>;

/**
 * The data that will be passed to the search function by the
 * {@link LisGeneFunctionSearchElement | `LisGeneFunctionSearchElement`} class when a search
 * is performed.
 */
export type GeneFunctionSearchData = {
  page: number;
  genus: string;
  species: string;
  geneIdentifier: string;
  traits: string;
  pubId: string;
  author: string;
};

/**
 * A publication associated with a gene function search result.
 */
export type GeneFunctionPublication = {
  citation: string;
  doi?: string;
  title?: string;
};

/**
 * A string value in a search result that may optionally opt out of linkout rendering.
 * Plain strings are treated as linkable when the containing column is in
 * {@link LisGeneFunctionSearchElement.linkoutColumns | `linkoutColumns`}.
 * Use the object form with `linkable: false` to render a value as plain text even
 * when its column is configured for linkouts.
 *
 * @example
 * ```js
 * // primary symbol is linkable (plain string), synonyms are not
 * geneSymbols: [symbol, ...synonyms.map(s => ({ value: s, linkable: false }))]
 * ```
 */
export type LinkableString = string | {value: string; linkable: false};

/**
 * A single result of a gene function search performed by the
 * {@link LisGeneFunctionSearchElement | `LisGeneFunctionSearchElement`} class.
 */
export type GeneFunctionSearchResult = {
  geneSymbols: LinkableString[];
  geneSymbolDescription: string;
  geneModelPubName: string;
  geneModelFullName: string;
  synopsis: string;
  traits: string[];
  citations?: GeneFunctionPublication | GeneFunctionPublication[];
};

/**
 * Maps result attribute names to linkout type strings. When set alongside
 * {@link LisGeneFunctionSearchElement.linkoutFunction | `linkoutFunction`},
 * cells for the specified columns will be rendered as links that open a
 * linkout modal. The type string is passed through to the linkout function
 * as `{type, variables: {identifier}}`.
 *
 * @example
 * ```js
 * searchElement.linkoutColumns = {
 *   geneSymbols: 'symbol',
 *   geneModelFullName: 'gene',
 * };
 * ```
 */
export type GeneFunctionLinkoutColumns = Record<string, string>;

/**
 * The signature of the function the
 * {@link LisGeneFunctionSearchElement | `LisGeneFunctionSearchElement`} class requires for
 * performing a gene function search.
 *
 * @param searchData An object containing a value of each field in the submitted form.
 * @param options Optional parameters that aren't required to perform a gene function search
 * but may be useful.
 *
 * @returns A {@link !Promise | `Promise`} that resolves to an
 * {@link !Array | `Array`} of {@link GeneFunctionSearchResult | `GeneFunctionSearchResult`}
 * objects.
 */
export type GeneFunctionSearchFunction = (
  searchData: GeneFunctionSearchData,
  options: PaginatedSearchOptions,
) => Promise<Array<GeneFunctionSearchResult>>;

/**
 * @htmlElement `<lis-gene-function-search-element>`
 *
 * A Web Component that provides a search form for searching gene functions and
 * displaying the results in a view table. Note that the component saves its state to the URL query
 * string parameters and a search will be automatically performed if the parameters are present when
 * the component is loaded. The component uses the
 * {@link mixins!LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin. See the mixin docs for
 * further details.
 *
 * @queryStringParameters
 * - **genus:** The selected genus in the search form.
 * - **species:** The selected species in the search form.
 * - **geneIdentifier:** The gene ID, symbol, or locus name provided in the search form.
 * - **traits:** The traits provided in the search form.
 * - **pubId:** The publication ID provided in the search form. Either a PubMed ID or a DOI.
 * - **author:** The author provided in the search form.
 * - **page:** What page of results is loaded. Starts at 1.
 *
 * @example
 * The {@link geneIdentifierExample | `geneIdentifierExample`}, {@link traitsExample | `traitsExample`},
 * {@link publicationExample | `publicationExample`}, and {@link authorExample | `authorExample`}
 * properties can be used to set the example text for the Gene ID, Traits, Publication ID, and Author
 * input fields, respectively. For example:
 * ```html
 * <!-- set the example text via HTML -->
 * <lis-gene-function-search-element
 *   geneIdentifierExample="Glyma01g37810"
 *   traitsExample="R8 full maturity"
 *   publicationExample="10.1111/jipb.13070"
 *   authorExample="Watanobe">
 * </lis-gene-function-search-element>
 *
 * <!-- set the example text via JavaScript -->
 * <lis-gene-function-search-element id="gene-function-search"></lis-gene-function-search-element>
 *
 * <script type="text/javascript">
 *   // get the gene function search element
 *   const searchElement = document.getElementById('gene-function-search');
 *   // set the element's example text properties
 *   searchElement.geneIdentifierExample = 'Glyma01g37810';
 *   searchElement.traitsExample = 'R8 full maturity';
 *   searchElement.publicationExample = '10.1111/jipb.13070';
 *   searchElement.authorExample = 'Watanobe';
 * </script>
 * ```
 */
@customElement('lis-gene-function-search-element')
export class LisGeneFunctionSearchElement extends LisPaginatedSearchMixin(
  LitElement,
)<GeneFunctionSearchData, GeneFunctionSearchResult>() {
  /** @ignore */
  // used by Lit to style the Shadow DOM
  // not necessary but exclusion breaks TypeDoc
  static override styles = css``;

  /**
   * The data used to construct the search form in the template.
   *
   * @attribute
   */
  @property()
  formData: GeneFunctionSearchFormData = {genuses: []};

  /**
   * An optional property that can be used to load the form data via an external function.
   * If used, the `formData` attribute/property will be updated using the result.
   */
  @property({type: Function, attribute: false})
  formDataFunction?: GeneFunctionFormDataFunction;

  /**
   * An optional property that limits searches to a specific genus. Setting the property to the
   * empty string "" will cause the genus form field to be set to the default "any" value.
   *
   * @attribute
   */
  @property({type: String})
  genus?: string;

  /**
   * An optional property that limits searches to a specific species. Setting the property to the
   * empty string "" will cause the species form field to be set to the default "any" value. Doesn't
   * work without the `genus` property.
   *
   * @attribute
   */
  @property({type: String})
  species?: string;

  /**
   * An optional property to set the example text for the Gene ID input field.
   *
   * @attribute
   */
  @property({type: String})
  geneIdentifierExample?: string;

  /**
   * An optional property to set the example text for the Traits input field.
   *
   * @attribute
   */
  @property({type: String})
  traitsExample?: string;

  /**
   * An optional property to set the example text for the Publication ID input field.
   *
   * @attribute
   */
  @property({type: String})
  publicationExample?: string;

  /**
   * An optional property to set the example text for the author input field.
   *
   * @attribute
   */
  @property({type: String})
  authorExample?: string;

  /**
   * An optional function for performing linkouts. When provided alongside
   * {@link linkoutColumns | `linkoutColumns`}, cells for the configured columns
   * will be rendered as links that open a linkout modal.
   */
  @property({type: Function, attribute: false})
  linkoutFunction?: LinkoutFunction<unknown>;

  /**
   * Maps result attribute names to linkout type strings passed to
   * {@link linkoutFunction | `linkoutFunction`}. Has no effect unless
   * `linkoutFunction` is also set.
   */
  @property({type: Object, attribute: false})
  linkoutColumns: GeneFunctionLinkoutColumns = {};

  // the selected index of the genus select element
  @state()
  private selectedGenus: number = 0;

  // the selected index of the species select element
  @state()
  private selectedSpecies: number = 0;

  // a controller that allows in-flight form data requests to be cancelled
  protected formDataCancelPromiseController = new LisCancelPromiseController(
    this,
  );

  // unique ID for the linkout modal — avoids conflicts when multiple instances are on the same page
  private _modalId = `lis-gene-function-linkout-${Math.random().toString(36).slice(2)}`;

  // direct reference to the linkout element — createRef is used instead of @query because
  // UIkit moves the modal <div> to document.body on open, which would break a querySelector
  private _linkoutRef: Ref<LisLinkoutElement> = createRef();

  // bind to the loading element in the template
  private _formLoadingRef: Ref<LisLoadingElement> = createRef();

  constructor() {
    super();
    // configure query string parameters
    this.requiredQueryStringParams = [
      ['genus'],
      ['genus', 'species'],
      ['geneIdentifier'],
      ['traits'],
      ['pubId'],
      ['author'],
    ];
    this.resultAttributes = [
      'geneSymbols',
      'geneSymbolDescription',
      'geneModelPubName',
      'geneModelFullName',
      'synopsis',
      'traits',
      'citations',
    ];
    this.tableHeader = {
      geneSymbols: 'Gene Symbols',
      geneSymbolDescription: 'Gene Symbol Description',
      geneModelPubName: 'Gene Model Pub Name',
      geneModelFullName: 'Gene Model Full Name',
      synopsis: 'Synopsis',
      traits: 'Traits',
      citations: 'Citations',
    };
    this.tableColumnClasses = {
      description: 'uk-table-expand',
    };
  }

  private _getDefaultGenus(): string {
    return this.valueOrQuerystringParameter(this.genus, 'genus');
  }

  private _getDefaultSpecies(): string {
    return this.valueOrQuerystringParameter(this.species, 'species');
  }

  // called when the component is added to the DOM; attributes should have properties now
  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this._handleLinkoutClick);
    // initialize the form data with querystring parameters so a search can be performed
    // before the actual form data is loaded
    const formData: GeneFunctionSearchFormData = {genuses: []};
    const genus = this._getDefaultGenus();
    if (genus) {
      formData.genuses.push({genus, species: []});
      const species = this._getDefaultSpecies();
      if (species) {
        formData.genuses[0].species.push({species});
      }
    }
    this.formData = formData;
    // set the selector values before the DOM is updated when the querystring parameters change
    this.queryStringController.addPreUpdateListener((_) => {
      this._initializeSelections();
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this._handleLinkoutClick);
  }

  // called after every component update, e.g. when a property changes
  override updated(changedProperties: Map<string, unknown>) {
    // call the formDataFunction every time its value changes
    if (changedProperties.has('formDataFunction') && this.formDataFunction) {
      this._getFormData();
    }
    // use querystring parameters to update the selectors when the form data changes
    if (
      changedProperties.has('formData') ||
      changedProperties.has('genus') ||
      changedProperties.has('species')
    ) {
      this._initializeSelections();
    }
  }

  // gets the data for the search form
  private _getFormData() {
    // update the loading element
    this._formLoadingRef.value?.loading();
    // make the form data function cancellable
    this.formDataCancelPromiseController.cancel();
    const options = {
      abortSignal: this.formDataCancelPromiseController.abortSignal,
    };
    const formDataPromise = this.formDataFunction!(options);
    // call the cancellable function
    this.formDataCancelPromiseController.wrapPromise(formDataPromise).then(
      (formData) => {
        this._formLoadingRef.value?.success();
        this.formData = formData;
      },
      (error: Error) => {
        // do nothing if the request was aborted
        if (!(error instanceof Event && error.type === 'abort')) {
          this._formLoadingRef.value?.failure();
          throw error;
        }
      },
    );
  }

  // sets the selected indexes based on properties and querystring parameters
  private async _initializeSelections() {
    const genus = this._getDefaultGenus();
    if (genus) {
      this.selectedGenus =
        this.formData.genuses.map(({genus}) => genus).indexOf(genus) + 1;
    } else {
      this.selectedGenus = 0;
    }

    await this.updateComplete;

    const species = this._getDefaultSpecies();
    if (this.selectedGenus && species) {
      this.selectedSpecies =
        this.formData.genuses[this.selectedGenus - 1].species
          .map(({species}) => species)
          .indexOf(species) + 1;
    } else {
      this.selectedSpecies = 0;
    }
  }

  // called when a genus is selected
  private _selectGenus(event: Event) {
    if (event.target != null) {
      this.selectedGenus = (event.target as HTMLSelectElement).selectedIndex;
      this.selectedSpecies = 0;
    }
  }

  // renders the genus selector
  private _renderGenusSelector() {
    const options = this.formData.genuses.map(({genus}) => {
      return html`<option value="${genus}">${genus}</option>`;
    });
    // HACK: the disabled attribute can't be set via template literal...
    if (this.genus !== undefined) {
      const value = this.selectedGenus
        ? this.formData.genuses[this.selectedGenus - 1].genus
        : '';
      return html`
        <select
          class="uk-select uk-form-small"
          disabled
          .selectedIndex=${live(this.selectedGenus)}
          @change="${this._selectGenus}"
        >
          <option value="">-- any --</option>
          ${options}
        </select>
        <input type="hidden" name="genus" value="${value}" />
      `;
    }
    return html`
      <select
        class="uk-select uk-form-small"
        name="genus"
        .selectedIndex=${live(this.selectedGenus)}
        @change="${this._selectGenus}"
      >
        <option value="">-- any --</option>
        ${options}
      </select>
    `;
  }

  // called when a species is selected
  private _selectSpecies(event: Event) {
    if (event.target != null) {
      this.selectedSpecies = (event.target as HTMLSelectElement).selectedIndex;
    }
  }

  // renders the species selector
  private _renderSpeciesSelector() {
    let options = [html``];
    if (this.selectedGenus) {
      options = this.formData.genuses[this.selectedGenus - 1].species.map(
        ({species}) => {
          return html`<option value="${species}">${species}</option>`;
        },
      );
    }
    // HACK: the disabled attribute can't be set via template literal...
    if (this.genus !== undefined && this.species !== undefined) {
      const value =
        this.selectedGenus && this.selectedSpecies
          ? this.formData.genuses[this.selectedGenus - 1].species[
              this.selectedSpecies - 1
            ].species
          : '';
      return html`
        <select
          class="uk-select uk-form-small"
          disabled
          .selectedIndex=${live(this.selectedSpecies)}
          @change="${this._selectSpecies}"
        >
          <option value="">-- any --</option>
          ${options}
        </select>
        <input type="hidden" name="species" value="${value}" />
      `;
    }
    return html`
      <select
        class="uk-select uk-form-small"
        name="species"
        .selectedIndex=${live(this.selectedSpecies)}
        @change="${this._selectSpecies}"
      >
        <option value="">-- any --</option>
        ${options}
      </select>
    `;
  }

  // handles clicks on linkout anchor tags produced by _transformResultForLinkouts
  private _handleLinkoutClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const link = target.closest('[data-linkout-type]') as HTMLElement | null;
    if (link && this._linkoutRef.value) {
      const type = link.getAttribute('data-linkout-type')!;
      const identifier = link.getAttribute('data-linkout-identifier')!;
      const label = link.getAttribute('data-linkout-label') ?? undefined;
      this._linkoutRef.value.getLinkouts({
        type,
        variables: {identifier, label},
      });
    }
  };

  // builds a linkout anchor string for use inside a table cell;
  // linkoutLabel is an optional hint passed to the linkout function as variables.label
  private _linkoutAnchor(
    type: string,
    identifier: string,
    anchorText: string,
    linkoutLabel?: string,
  ): string {
    const escapedId = identifier.replace(/"/g, '&quot;');
    const labelAttr = linkoutLabel
      ? ` data-linkout-label="${linkoutLabel.replace(/"/g, '&quot;')}"`
      : '';
    return `<a href="#${this._modalId}" uk-toggle data-linkout-type="${type}" data-linkout-identifier="${escapedId}"${labelAttr}>${anchorText}</a>`;
  }

  // transforms every result row to a flat StringObjectModel for the table;
  // citations (a structured object) are always converted to a display string,
  // and linkout columns are rendered as anchors when linkoutFunction is set
  private _transformResult(
    result: GeneFunctionSearchResult,
  ): StringObjectModel {
    const transformed: StringObjectModel = {};
    for (const attr of this.resultAttributes) {
      // citations: render each publication as a linkout trigger or DOI link;
      // supports a single GeneFunctionPublication or an array of them
      if (attr === 'citations') {
        const raw = result.citations;
        const pubs: GeneFunctionPublication[] = !raw
          ? []
          : Array.isArray(raw)
            ? raw
            : [raw];
        transformed[attr] = pubs
          .map((pub) => {
            if (!pub.citation) return '';
            if (this.linkoutFunction && pub.doi) {
              return this._linkoutAnchor(
                'publication',
                pub.doi,
                pub.citation,
                pub.title,
              );
            }
            if (pub.doi) {
              const escapedDoi = pub.doi.replace(/"/g, '&quot;');
              return `<a href="https://doi.org/${escapedDoi}">${pub.citation}</a>`;
            }
            return pub.citation;
          })
          .filter(Boolean)
          .join('; ');
        continue;
      }
      const value = (result as unknown as Record<string, unknown>)[attr];
      if (value === undefined || value === null) {
        transformed[attr] = '';
        continue;
      }
      const type = this.linkoutFunction ? this.linkoutColumns[attr] : undefined;
      if (!type) {
        transformed[attr] = Array.isArray(value)
          ? (value as LinkableString[])
              .map((item) => (typeof item === 'string' ? item : item.value))
              .join(', ')
          : String(value);
        continue;
      }
      const items = Array.isArray(value)
        ? (value as LinkableString[])
        : [String(value)];
      transformed[attr] = items
        .map((item) => {
          const str = typeof item === 'string' ? item : item.value;
          const doLink = typeof item === 'string' || item.linkable !== false;
          return doLink ? this._linkoutAnchor(type, str, str) : str;
        })
        .join(', ');
    }
    return transformed;
  }

  /** @ignore */
  // overrides the mixin's default results rendering to support linkout columns and
  // structured citations
  protected override renderResults(): unknown {
    const data = this.searchResults.map((r) =>
      this._transformResult(r as unknown as GeneFunctionSearchResult),
    );

    const table = html`
      <lis-simple-table-element
        .dataAttributes=${this.resultAttributes}
        .header=${this.tableHeader}
        .columnClasses=${this.tableColumnClasses}
        .data=${data}
      ></lis-simple-table-element>
    `;

    if (!this.linkoutFunction) {
      return table;
    }

    return html`
      ${table}
      <lis-modal-element modalId="${this._modalId}">
        <lis-linkout-element
          ${ref(this._linkoutRef)}
          .linkoutFunction=${this.linkoutFunction}
        ></lis-linkout-element>
      </lis-modal-element>
    `;
  }

  /** @ignore */
  // used by LisPaginatedSearchMixin to draw the search form part of template
  override renderForm() {
    // render the form's selectors
    const genusSelector = this._renderGenusSelector();
    const speciesSelector = this._renderSpeciesSelector();

    // render the form
    return html`
      <form class="uk-form-stacked">
        <fieldset class="uk-fieldset">
          <legend class="uk-legend">Gene Function Search</legend>
          <lis-loading-element
            ${ref(this._formLoadingRef)}
          ></lis-loading-element>
          <div class="uk-margin uk-grid-small" uk-grid>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="genus">Genus</label>
              ${genusSelector}
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="species">Species</label>
              ${speciesSelector}
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="geneIdentifier"
                >Gene ID, symbol, or locus name</label
              >
              <input
                class="uk-input"
                type="text"
                name="geneIdentifier"
                .value=${this.queryStringController.getParameter(
                  'geneIdentifier',
                )}
              />
              <lis-form-input-example-element
                .text=${this.geneIdentifierExample}
              ></lis-form-input-example-element>
            </div>
          </div>
          <div class="uk-margin uk-grid-small" uk-grid>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="traits">Traits</label>
              <input
                class="uk-input"
                type="text"
                name="traits"
                .value=${this.queryStringController.getParameter('traits')}
              />
              <lis-form-input-example-element
                .text=${this.traitsExample}
              ></lis-form-input-example-element>
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="pubId"
                >Publication ID (DOI or PMID)</label
              >
              <input
                class="uk-input"
                type="text"
                name="pubId"
                .value=${this.queryStringController.getParameter('pubId')}
              />
              <lis-form-input-example-element
                .text=${this.publicationExample}
              ></lis-form-input-example-element>
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="author">Author</label>
              <input
                class="uk-input"
                type="text"
                name="author"
                .value=${this.queryStringController.getParameter('author')}
              />
              <lis-form-input-example-element
                .text=${this.authorExample}
              ></lis-form-input-example-element>
            </div>
          </div>
          <div class="uk-margin">
            <button type="submit" class="uk-button uk-button-primary">
              Search
            </button>
          </div>
        </fieldset>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-gene-function-search-element': LisGeneFunctionSearchElement;
  }
}
