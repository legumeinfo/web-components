import {LitElement, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {LisPaginatedSearchMixin, PaginatedSearchOptions} from './mixins';
import {property, state} from 'lit/decorators.js';
import {LisCancelPromiseController} from './controllers';
import {LisLoadingElement} from './core';
import {createRef, ref, Ref} from 'lit/directives/ref.js';
import {live} from 'lit/directives/live.js';

/**
 * The data used to construct the search form in the
 * {@link LisTraitAssociationSearchElement | `LisTraitAssociationSearchElement`} template.
 */
export type TraitAssociationSearchFormData = {
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
export type TraitAssociationSearchFormDataOptions = {abortSignal?: AbortSignal};

/**
 * The type signature of a function that may be used to load the data used to construct
 * the search form in the {@link LisTraitAssociationSearchElement | `LisTraitAssociationSearchElement`}
 * template.
 */
export type TraitAssociationFormDataFunction = (
  options: TraitAssociationSearchFormDataOptions,
) => Promise<TraitAssociationSearchFormData>;

/**
 * The data that will be passed to the search function by the
 * {@link LisTraitAssociationSearchElement | `LisTraitAssociationSearchElement`} class when a search
 * is performed.
 */
export type TraitAssociationSearchData = {
  genus: string;
  species: string;
  type: string;
  traits: string;
  pubId: string;
  author: string;
};

/**
 * A single result of a trait association search performed by the
 * {@link LisTraitAssociationSearchElement | `LisTraitAssociationSearchElement`} class.
 * Contains the name of the trait and either a GWAS or QTL study object.
 *
 */
export type TraitAssociationSearchResult = {
  name: string;
  type: string;
  identifier: string;
  synopsis: string;
  description: string;
  genotypes: string;
};

/**
 * The signature of the function the
 * {@link LisTraitAssociationSearchElement | `LisTraitAssociationSearchElement`} class requires for
 * performing a trait association search.
 *
 * @param searchData An object containing a value of each field in the submitted form.
 * @param page What page of results the search is for. Will always be 1 when a new search is performed.
 * @param options Optional parameters that aren't required to perform a trait association search
 * but may be useful.
 *
 * @returns A {@link !Promise | `Promise`} that resolves to an
 * {@link !Array | `Array`} of {@link TraitAssociationSearchResult | `TraitAssociationSearchResult`}
 * objects.
 */
export type TraitAssociationSearchFunction = (
  searchData: {
    genus: string;
    species: string;
    traits: string;
    type: string;
    pubId: string;
    author: string;
  },
  page: number,
  options: PaginatedSearchOptions,
) => Promise<Array<TraitAssociationSearchResult>>;

/**
 * @htmlElement `<lis-trait-association-search-element>`
 *
 * A Web Component that provides a search form for searching for GWAS and QTL trait associations and
 * displaying the results in a view table. Note that the component saves its state to the URL query
 * string parameters and a search will be automatically performed if the parameters are present when
 * the componnent is loaded. The component uses the
 * {@link mixins!LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin. See the mixin docs for
 * further details.
 *
 * @queryStringParameters
 * - **genus:** The selected genus in the search for.
 * - **species:** The selected species in the search for.
 * - **type:** The selected type in the search form. Either 'GWAS' or 'QTL'.
 * - **traits:** The traits provided in the search form.
 * - **pubid** The publication ID provided in the search form. Either a PubMed ID or a DOI.
 * - **author** The author provided in the search form.
 * - **page:** What page of results is loaded. Starts at 1.
 *
 * @example
 * {@link !HTMLElement | `HTMLElement`} properties can only be set via
 * JavaScript. This means the {@link searchFunction | `searchFunction`} property
 * must be set on a `<lis-trait-association-search-element>` tag's instance of the
 * {@link LisTraitAssociationSearchElement | `LisTraitAssociationSearchElement`} class. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-trait-association-search-element id="trait-association-search"></lis-trait-association-search-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // a site-specific function that sends a request to a trait association search API
 *   function getTraits(searchData, page, {abortSignal}) {
 *     // returns a Promise that resolves to a search result object
 *   }
 *   // get the trait association search element
 *   const searchElement = document.getElementById('trait-association-search');
 *   // set the element's searchFunction property
 *   searchElement.searchFunction = getTraits;
 * </script>
 * ```
 *
 * @example
 * Data must be provided for the genus and species selectors in the search form.
 * This can be done by setting the form's {@link formData | `formData`} attribute/property directly
 * or by setting the {@link formDataFunction | `formDataFunction`} property. Setting the latter will
 * call the function immediately and set the {@link formData | `formData`} value using the result.
 * For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-trait-association-search-element id="trait-association-search"></lis-trait-association-search-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // a site-specific function that gets genus and species data from an API
 *   function getFormData() {
 *     // returns a Promise that resolves to a form data object
 *   }
 *   // get the trait association search element
 *   const searchElement = document.getElementById('trait-association-search');
 *   // set the element's formDataFunction property
 *   searchElement.formDataFunction = getGeneFormData;
 * </script>
 * ```
 *
 * @example
 * The {@link genus | `genus`} and {@link species | `species`} properties can be used to limit all
 * searches to a specific genus and species. This will cause the genus and species fields of the
 * search form to be automatically set and disabled so that users cannot change them. Additionally,
 * these properties cannot be overridden using the `genus` and `species` querystring parameters.
 * However, like the `genus` and `species` querystring parameters, if the genus/species set are not
 * present in the `formData` then the genus/species form fields will be set to the default `any`
 * value. Note that setting the `species` value has no effect if the `genus` value is not also set.
 * For example:
 * ```html
 * <!-- restrict the genus via HTML -->
 * <lis-trait-association-search-element genus="Glycine"></lis-trait-association-search-element>
 *
 * <!-- restrict the genus and species via HTML -->
 * <lis-trait-association-search-element genus="Glycine" species="max"></lis-trait-association-search-element>
 *
 * <!-- restrict the genus and species via JavaScript -->
 * <lis-trait-association-search-element id="trait-association-search"></lis-trait-association-search-element>
 *
 * <script type="text/javascript">
 *   // get the trait association search element
 *   const searchElement = document.getElementById('trait-association-search');
 *   // set the element's genus and species properties
 *   searchElement.genus = "Cicer";
 *   searchElement.species = "arietinum";
 * </script>
 * ```
 *
 * @example
 * The {@link traitsExample | `traitsExample`}, {@link publicationExample | `publicationExample`}, and
 * {@link authorExample | `authorExample`} properties can be used to set the example text for the
 * Traits, Publication ID, and Author input fields, respectively. For example:
 * ```html
 * <!-- set the example text via HTML -->
 * <lis-trait-association-search-element traitsExample="R8 full maturity" publicationExample="10.2135/cropsci2005.05-0168" authorExample="Specht"></lis-trait-association-search-element>
 *
 * <!-- set the example text via JavaScript -->
 * <lis-trait-association-search-element id="trait-association-search"></lis-trait-association-search-element>
 *
 * <script type="text/javascript">
 *  // get the trait association search element
 * const searchElement = document.getElementById('trait-association-search');
 * // set the element's example text properties
 * searchElement.traitsExample = "R8 full maturity";
 * searchElement.publicationExample = "10.2135/cropsci2005.05-0168";
 * searchElement.authorExample = "Specht";
 * </script>
 * ```
 */
@customElement('lis-trait-association-search-element')
export class LisTraitAssociationSearchElement extends LisPaginatedSearchMixin(
  LitElement,
)<TraitAssociationSearchData, TraitAssociationSearchResult>() {
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
  formData: TraitAssociationSearchFormData = {genuses: []};

  /**
   * An optional property that can be used to load the form data via an external function.
   * If used, the `formData` attribute/property will be updated using the result.
   */
  @property({type: Function, attribute: false})
  formDataFunction: TraitAssociationFormDataFunction = () =>
    Promise.reject(new Error('No form data function provided'));

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
   * An optional parameter to set the example text for the Traits input field.
   */
  @property({type: String})
  traitsExample: string = 'R8 full maturity';

  /**
   * An optional parameter to set the example text for the Publication ID input field.
   */
  @property({type: String})
  publicationExample: string = '10.2135/cropsci2005.05-0168';

  /**
   * An optional parameter to set the example text for the Author input field.
   */
  @property({type: String})
  authorExample: string = 'Blair';

  // the selected index of the genus select element
  @state()
  private selectedGenus: number = 0;

  // the selected index of the species select element
  @state()
  private selectedSpecies: number = 0;

  // available study types
  private _studyTypes = ['GWAS', 'QTL'];

  // the index of the selected type of study (GWAS or QTL)
  @state()
  private selectedType: number = 0;

  // a controller that allows in-flight form data requests to be cancelled
  protected formDataCancelPromiseController = new LisCancelPromiseController(
    this,
  );

  // bind to the loading element in the template
  private _formLoadingRef: Ref<LisLoadingElement> = createRef();

  constructor() {
    super();
    // configure query string parameters
    this.requiredQueryStringParams = [
      ['genus'],
      ['genus', 'species'],
      ['traits'],
      ['type'],
      ['pubid'],
      ['author'],
    ];
    this.resultAttributes = [
      'identifier',
      'type',
      'synopsis',
      'description',
      'name',
      'genotypes',
    ];
    this.tableHeader = {
      identifier: 'Study Name',
      type: 'Study Type',
      synopsis: 'Synopsis',
      description: 'Description',
      name: 'Name',
      genotypes: 'Genotypes',
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
    // initialize the form data with querystring parameters so a search can be performed
    // before the actual form data is loaded
    const formData: TraitAssociationSearchFormData = {genuses: []};
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

  // called after every component update, e.g. when a property changes
  override updated(changedProperties: Map<string, unknown>) {
    // call the formDataFunction every time its value changes
    if (changedProperties.has('formDataFunction')) {
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
    const formDataPromise = this.formDataFunction(options);
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

    await this.updateComplete;

    const type = this.queryStringController.getParameter('type');
    if (type) {
      this.selectedType = this._studyTypes.indexOf(type) + 1;
    } else {
      this.selectedType = 0;
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

  // called when a type is selected
  private _selectType(event: Event) {
    if (event.target != null) {
      this.selectedType = (event.target as HTMLSelectElement).selectedIndex;
    }
  }

  // renders the type selector
  private _renderTypeSelector() {
    const options = this._studyTypes.map((type) => {
      return html`<option value="${type}">${type}</option>`;
    });
    return html`
      <select
        class="uk-select uk-form-small"
        name="type"
        .selectedIndex=${live(this.selectedType)}
        @change="${this._selectType}"
      >
        <option value="">-- any --</option>
        ${options}
      </select>
    `;
  }

  /** @ignore */
  // used by LisPaginatedSearchMixin to draw the search form part of template
  override renderForm() {
    // render the form's selectors
    const genusSelector = this._renderGenusSelector();
    const speciesSelector = this._renderSpeciesSelector();
    const typeSelector = this._renderTypeSelector();

    // render the form
    return html`
      <form class="uk-form-stacked uk-inline">
        <fieldset class="uk-fieldset">
          <legend class="uk-legend">Trait Association Search</legend>
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
              <label class="uk-form-label" for="type">Study Type</label>
              ${typeSelector}
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
              <span class="uk-text-small">e.g. ${this.traitsExample}</span>
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="pubId"
                >Publication ID (DOI or PMID)</label
              >
              <input
                class="uk-input"
                type="text"
                name="pubId"
                .value=${this.queryStringController.getParameter('pubid')}
              />
              <span class="uk-text-small">e.g. ${this.publicationExample}</span>
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="author">Author</label>
              <input
                class="uk-input"
                type="text"
                name="author"
                .value=${this.queryStringController.getParameter('author')}
              />
              <span class="uk-text-small">e.g. ${this.authorExample}</span>
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
    'lis-trait-association-search-element': LisTraitAssociationSearchElement;
  }
}
