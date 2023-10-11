import {LitElement, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {LisPaginatedSearchMixin, PaginatedSearchOptions} from './mixins';
import {property, state} from 'lit/decorators.js';
import {LisCancelPromiseController} from './controllers';
import {LisLoadingElement} from './core';
import {createRef, ref, Ref} from 'lit/directives/ref.js';
import {live} from 'lit/directives/live.js';
// import {unsafeHTML} from 'lit/directives/unsafe-html.js';

/**
 * The data used to construct the search form in the
 * {@link LisTraitAssociationSearchElement | `LisTraitAssociationSearchElement`} template.
 */
export type AssociationSearchFormData = {
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
export type AssociationSearchFormDataOptions = {abortSignal?: AbortSignal};

export type AssociationFormDataFunction = (
  options: AssociationSearchFormDataOptions,
) => Promise<AssociationSearchFormData>;

/**
 * The data that will be passed to the search function by the
 * {@link LisTraitAssociationSearchElement | `LisTraitAssociationSearchElement`} class when a search is performed.
 */
export type AssociationSearchData = {
  query: string;
};

/**
 * A single result of an association search performed by the
 * {@link LisTraitAssociationSearchElement | `LisTraitAssociationSearchElement`} class.
 * Contains the name of the trait and either a GWAS or QTL study object.
 *
 */
export type TraitAssociationResult = {
  name: string;
  type: string;
  identifier: string;
  synopsis: string;
  description: string;
  genotypes: string;  
};

/**
 * Search function for the {@link LisTraitAssociationSearchElement | `LisTraitAssociationSearchElement`} class.
 * Shared by both GWAS and QTL searches.
 *
 * @param searchData The data to use to perform the search.
 * @param page What page of results the search is for. Will always be 1 when a new search is performed.
 * @param options Optional parameters.
 *
 * @returns A {@link !Promise | `Promise`} that resolves to an
 * {@link !Array | `Array`} of {@link TraitAssociationResult | `TraitAssociationResult`}
 * objects.
 */
export type AssociationSearchFunction = (
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
) => Promise<Array<TraitAssociationResult>>;

/**
 * @htmlElement `<lis-trait-association-search>`
 *
 * A Web Component that provides a search form for searching for GWAS and QTL trait associations.
 *
 * {@link mixins!LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin. See
 * the mixin docs for further details.
 *
 * @queryStringParameters
 * - **page:** What page of results is loaded. Starts at 1.
 * - **genus:** The genus to search for.
 * - **species:** The species to search for.
 * - **type:** The type of study to search for. Either 'GWAS' or 'QTL'. If not provided, both types will be searched.
 * - **traits:** The traits to search for. URL encoded. Can be a full trait name or a partial trait name. Case insensitive.
 * - **pubId** The publication ID to search for. Either a PubMed ID or a DOI.
 * - **author** The author to search for. Can be a full name or a partial name. Case insensitive.
 *
 * @example
 * {@link !HTMLElement | `HTMLElement`} properties can only be set via
 * JavaScript. This means the {@link searchFunction | `searchFunction`} property
 * must be set on a `<lis-trait-association-search-element>` tag's instance of the
 * {@link LisTraitAssociationSearchElement | `LisTraitAssociationSearchElement`} class. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-association-search-element id="association-search"></lis-association-search-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // Site specific search function
 *   function getTraits(searchData, page, {abortSignal}) {
 *     // returns a Promise that resolves to a search result object
 *   }
 *   // get the association search element
 *   const searchElement = document.getElementById('association-search');
 *   // set the element's searchFunction property
 *   searchElement.searchFunction = getTraits;
 * </script>
 * ```
 *
 * @example
 * The {@link genus | `genus`} property can be used to limit all searches to a specific
 * genus. This will cause the genus field of the search form to be automatically set and
 * disabled so that users cannot change it. Additionally, this property cannot be
 * overridden using the `genus` querystring parameter. However, like the `genus`
 * querystring parameter, if the genus set is not present in the `formData` then the
 * genus form field will be set to the default `any` value. For example:
 * ```html
 * <!-- restrict the genus via HTML -->
 * <lis-association-search-element genus="Glycine"></lis-association-search-element>
 *
 * <!-- restrict the genus via JavaScript -->
 * <lis-association-search-element id="association-search"></lis-association-search-element>
 * <script type="text/javascript">
 *   // get the trait association search element
 *   const AssociationSearchElement = document.getElementById('association-search');
 *   // set the element's genus property
 *   AssociationSearchElement.genus = "Cicer";
 * </script>
 * ```
 */

@customElement('lis-association-search-element')
export class LisTraitAssociationSearchElement extends LisPaginatedSearchMixin(
  LitElement,
)<AssociationSearchData, TraitAssociationResult>() {
  //Available study types
  private studyTypes = ['GWAS', 'QTL'];

  /** @ignore */
  // used by Lit to style the Shadow DOM
  // not necessary but exclusion breaks TypeDoc
  static override styles = css``;

  /**
   * An optional property that limits searches to a specific genus.
   */
  @property({type: String})
  genus?: string;

  /**
   * The data used to construct the search form in the template.
   *
   * @attribute
   */
  @property()
  formData: AssociationSearchFormData = {genuses: []};

  // the selected index of the genus select element
  @state()
  private selectedGenus: number = 0;

  // the selected index of the species select element
  @state()
  private selectedSpecies: number = 0;

  // the index of the selected type of study (GWAS or QTL)
  @state()
  private selectedType: number = 0;

  // a controller that allows in-flight form data requests to be cancelled
  protected formDataCancelPromiseController = new LisCancelPromiseController(
    this,
  );

  // bind to the loading element in the template
  private _formLoadingRef: Ref<LisLoadingElement> = createRef();

  @property({type: Function, attribute: false})
  formDataFunction: AssociationFormDataFunction = () =>
    Promise.reject(new Error('No form data function provided'));

  constructor() {
    super();
    // configure query string parameters
    this.requiredQueryStringParams = [
      ['genus'],
      ['genus', 'species'],
      ['traits'],
      ['type'],
      ['pubID'],
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

    // initialize the form data with querystring parameters so a search can be performed
    // before the actual form data is loaded
    const formData: AssociationSearchFormData = {genuses: []};
    const genus = this.queryStringController.getParameter('genus');
    if (genus) {
      formData.genuses.push({genus, species: []});
      const species = this.queryStringController.getParameter('species');
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
  // called when the component is added to the DOM; attributes should have properties now
  override connectedCallback() {
    super.connectedCallback();
    // initialize the form data with querystring parameters so a search can be performed
    // before the actual form data is loaded
    const formData: AssociationSearchFormData = {genuses: []};
    const genus =
      this.genus || this.queryStringController.getParameter('genus');
    if (genus) {
      formData.genuses.push({genus, species: []});
      const species = this.queryStringController.getParameter('species');
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
    if (changedProperties.has('formData')) {
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

  // called when the form is submitted
  private _initializeSelections() {
    const genus =
      this.genus || this.queryStringController.getParameter('genus');
    if (genus) {
      this.selectedGenus =
        this.formData.genuses.map(({genus}) => genus).indexOf(genus) + 1;
    } else {
      this.selectedGenus = 0;
    }
    const species = this.queryStringController.getParameter('species');
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

  /**
   * Renders the genus selector.
   * @param onlyGenus - If set, only render a single genus.
   * @private
   */
  private _renderGenusSelector() {
    const options = this.formData.genuses.map(({genus}) => {
      return html`<option value="${genus}">${genus}</option>`;
    });
    // HACK: the disabled attribute can't be set via template literal...
    if (this.genus) {
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
        <input type="hidden" name="genus" value="${this.genus}" />
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

  /**
   * Handles the selection of a type (GWAS or QTL)
   * @param event
   * @private
   */
  private _selectType(event: Event) {
    if (event.target != null) {
      this.selectedType = (event.target as HTMLSelectElement).selectedIndex;
    }
  }

  // renders the type selector
  private _renderTypeSelector() {
    const options = this.studyTypes.map((type) => {
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
              <span class="uk-text-small">e.g. R8 full maturity</span>
            </div>
            <div class="uk-width-1-4@s">
              <label class="uk-form-label" for="pubId"
                >Publication ID (DOI or PMID)</label
              >
              <input
                class="uk-input"
                type="text"
                name="pubId"
                .value=${this.queryStringController.getParameter('pubId')}
              />
              <span class="uk-text-small"
                >e.g. 10.2135/cropsci2005.05-0168</span
              >
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="author">Author</label>
              <input
                class="uk-input"
                type="text"
                name="author"
                .value=${this.queryStringController.getParameter('author')}
              />
              <span class="uk-text-small">e.g. Nichols, D. M.</span>
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
    'lis-association-search-element': LisTraitAssociationSearchElement;
  }
}
