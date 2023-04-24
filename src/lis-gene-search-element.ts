import {LitElement, css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {live} from 'lit/directives/live.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';


import {LisCancelPromiseController} from './controllers';
import {LisAlertElement} from './core';
import {LisPaginatedSearchMixin, PaginatedSearchOptions} from './mixins';


/**
 * The data used to construct the search form in the
 * {@link LisGeneSearchElement | `LisGeneSearchElement`} template.
 */
export type GeneSearchFormData = {
  genuses: {
    genus: string,
    species: {
      species: string,
      strains: {
        strain: string,
      }[],
    }[],
  }[];
};


/**
 * Optional parameters that may be given to a form data function. The
 * {@link !AbortSignal | `AbortSignal`} instance will emit if a new function is provided
 * before the current function completes. This signal should be used to cancel in-flight
 * requests if the external API supports it.
 */
export type GeneFormDataOptions = {abortSignal?: AbortSignal};


/**
 * The type signature of a function that may be used to load the data used to construct
 * the search form in the {@link LisGeneSearchElement | `LisGeneSearchElement`} template.
 */
export type GeneFormDataFunction =
  (options: GeneFormDataOptions) => Promise<GeneSearchFormData>;


/**
 * The data that will be passed to the search function by the
 * {@link LisGeneSearchElement | `LisGeneSearchElement`} class when a search is
 * performed.
 */
export type GeneSearchData = {
  genus: string;
  name: string;
  identifier: string;
  description: string;
};


/**
 * A single result of a gene search performed by the
 * {@link LisGeneSearchElement | `LisGeneSearchElement`} class.
 */
export type GeneSearchResult = {
  name: string;
  identifier: string;
  description: string;
  genus: string;
  species: string;
  strain: string;
  geneFamilyAssignments: string[],
  locations: {
    chromosome?: string,
    supercontig?: string,
    start: number,
    end: number,
    strand: string,
  },
};


/**
 * The signature of the function the
 * {@link LisGeneSearchElement | `LisGeneSearchElement`} class requires for
 * performing a gene search.
 *
 * @param searchData An object containing a value of each field in the submitted form.
 * @param page What page of results the search is for. Will always be 1 when a
 * new search is performed.
 * @param options Optional parameters that aren't required to perform a gene
 * search but may be useful.
 *
 * @returns A {@link !Promise | `Promise`} that resolves to an
 * {@link !Array | `Array`} of {@link GeneSearchResult | `GeneSearchResult`}
 * objects.
 */
export type GeneSearchFunction =
  (
    searchData: {
      genus: string,
      species: string,
      strain: string,
      identifier: string,
      description: string,
      geneFamilyIdentifier: string,
    },
    page: number,
    options: PaginatedSearchOptions
  ) => Promise<Array<GeneSearchResult>>;


/**
 * @htmlElement `<lis-gene-search-element>`
 *
 * A Web Component that provides an interface for performing searches for genes and
 * displaying results in a view table. Note that the component saves its state to the
 * URL query string parameters and a search will be automatically performed if the
 * parameters are present when the componnent is loaded. The component uses the
 * {@link mixins!LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin. See the
 * mixin docs for further details.
 *
 * @queryStringParameters
 * - **genus:** The selected genus in the search form.
 * - **species:** The selected genus in the search form.
 * - **strain:** The selected strain in the search form.
 * - **identifier:** The identifier provided in the search form.
 * - **description:** The description provided in the search form.
 * - **family:** The gene family identifier provided in the search form.
 * - **page:** What page of results to load.
 *
 * @example 
 * {@link !HTMLElement | `HTMLElement`} properties can only be set via
 * JavaScript. This means the {@link searchFunction | `searchFunction`} property
 * must be set on a `<lis-gene-search-element>` tag's instance of the
 * {@link LisGeneSearchElement | `LisGeneSearchElement`} class. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-gene-search-element id="gene-search"></lis-gene-search-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // a site-specific function that sends a request to a gene search API
 *   function getGenes(searchData, page, {abortSignal}) {
 *     // returns a Promise that resolves to a search result object
 *   }
 *   // get the gene search element
 *   const searchElement = document.getElementById('gene-search');
 *   // set the element's searchFunction property
 *   searchElement.searchFunction = getGenes;
 * </script>
 * ```
 *
 * @example 
 * Data must be provided for the genus, species, and strain selectors in the search form.
 * This can be done by setting the form's {@link formData | `formData`}
 * attribute/property directly or by setting the
 * {@link formDataFunction | `formDataFunction`} property. Setting the latter will call
 * the function immediately and set the {@link formData | `formData`} value using the
 * result. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-gene-search-element id="gene-search"></lis-gene-search-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // a site-specific function that gets genus, species, and strain data from an API
 *   function getFormData() {
 *     // returns a Promise that resolves to a form data object
 *   }
 *   // get the gene search element
 *   const geneSearchElement = document.getElementById('gene-search');
 *   // set the element's formDataFunction property
 *   geneSearchElement.formDataFunction = getGeneFormData;
 * </script>
 * ```
 */
@customElement('lis-gene-search-element')
export class LisGeneSearchElement extends
LisPaginatedSearchMixin(LitElement)<GeneSearchData, GeneSearchResult>() {

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
  formData: GeneSearchFormData = {genuses: []}

  /**
   * An optional property that can be used to load the form data via an external function.
   * If used, the loading status of the data will be displayed in an alert element and
   * the `formData` attribute/property will be updated using the result.
   *
   * @attribute
   */
  @property({type: Function, attribute: false})
  formDataFunction: GeneFormDataFunction =
    () => Promise.reject(new Error('No form data function provided'));

  // the selected index of the genus select element
  @state()
  private selectedGenus: number = 0;

  // the selected index of the species select element
  @state()
  private selectedSpecies: number = 0;

  // the selected index of the strain select element
  @state()
  private selectedStrain: number = 0;

  // a controller that allows in-flight form data requests to be cancelled
  protected formDataCancelPromiseController = new LisCancelPromiseController(this);

  // bind to the alert element in the template
  private _formAlertRef: Ref<LisAlertElement> = createRef();

  constructor() {
    super();
    // configure query string parameters
    this.requiredQueryStringParams = [
        ['genus'],
        ['genus', 'species'],
        ['genus', 'species', 'strain'],
        ['identifier'],
        ['description'],
        ['family'],
      ];
    // initialize the form data with querystring parameters so a search can be performed
    // before the actual form data is loaded
    const formData: GeneSearchFormData = {genuses: []};
    const genus = this.queryStringController.getParameter('genus');
    if (genus) {
      formData.genuses.push({genus, species: []});
      const species = this.queryStringController.getParameter('species');
      if (species) {
        formData
          .genuses[0]
          .species.push({species, strains: []});
        const strain = this.queryStringController.getParameter('strain');
        if (strain) {
          formData
            .genuses[0]
            .species[0]
            .strains.push({strain});
        }
      }
    }
    this.formData = formData;
  }

  // called after every component update, e.g. when a property changes
  override updated(changedProperties: Map<string, any>) {
    // call the formDataFunction every time its value changes
    if (changedProperties.has('formDataFunction')) {
      this._getFormData();
    }
    // attempt to change the selected index based on querystring parameters
    if (changedProperties.has('formData')) {
      this._initializeSelections();
    }
  }

  // gets the data for the search form
  private _getFormData() {
    // update the alert element
    this._alertFormDataLoading();
    // make the form data function cancellable
    this.formDataCancelPromiseController.cancel();
    const options = {abortSignal: this.formDataCancelPromiseController.abortSignal};
    const formDataPromise = this.formDataFunction(options);
    // call the cancellable function
    this.formDataCancelPromiseController.wrapPromise(formDataPromise)
      .then(
        (formData) => {
          this._alertFormDataSuccess();
          this.formData = formData;
        },
        (error: Error) => {
          // do nothing if the request was aborted
          if ((error as any).type !== 'abort') {
            this._alertFormDataFailure
          }
        },
      );
  }

  // sets the selected indexes based on querystring parameters
  private _initializeSelections() {
    const genus = this.queryStringController.getParameter('genus');
    if (genus) {
      this.selectedGenus =
        this.formData
          .genuses
            .map(({genus}) => genus)
            .indexOf(genus)+1;
    } else {
      this.selectedGenus = 0;
    }
    const species = this.queryStringController.getParameter('species');
    if (this.selectedGenus && species) {
      this.selectedSpecies =
        this.formData
          .genuses[this.selectedGenus-1]
          .species
            .map(({species}) => species)
            .indexOf(species)+1;
    } else {
      this.selectedSpecies = 0;
    }
    const strain = this.queryStringController.getParameter('strain');
    if (this.selectedSpecies && strain) {
      this.selectedStrain =
        this.formData
          .genuses[this.selectedGenus-1]
          .species[this.selectedSpecies-1]
          .strains
            .map(({strain}) => strain)
            .indexOf(strain)+1;
    } else {
      this.selectedStrain = 0;
    }
  }

  // sets the form alert element to a loading state
  private _alertFormDataLoading() {
    const message = `<span uk-spinner></span> Loading form data`;
    this._formAlertRef.value?.primary(message);
  }

  // sets the form alert element to a load success state
  private _alertFormDataSuccess() {
    const message = `Form data loaded`;
    this._formAlertRef.value?.success(message);
  }

  // sets the form alert element to a load error state
  private _alertFormDataFailure(error: Error) {
    const message = `Failed to load form data`;
    this._formAlertRef.value?.danger(message);
    throw error;
  }

  // called when a genus is selected
  private _selectGenus(event: Event) {
    // @ts-ignore
    this.selectedGenus = event.target.selectedIndex;
    this.selectedSpecies = 0;
    this.selectedStrain = 0;
  }

  // renders the genus selector
  private _renderGenusSelector() {
    const options =
      this.formData.genuses.map(({genus}) => {
        return html`<option value="${genus}">${genus}</option>`;
      });
    return html`
      <select class="uk-select uk-form-small" name="genus"
        .selectedIndex=${live(this.selectedGenus)}
        @change="${this._selectGenus}">
        <option value="">-- any --</option>
        ${options}
      </select>
    `;
  }

  // called when a species is selected
  private _selectSpecies(event: Event) {
    // @ts-ignore
    this.selectedSpecies = event.target.selectedIndex;
    this.selectedStrain = 0;
  }

  // renders the species selector
  private _renderSpeciesSelector() {
    let options = [html``];
    if (this.selectedGenus) {
      options =
        this.formData.genuses[this.selectedGenus-1].species.map(({species}) => {
          return html`<option value="${species}">${species}</option>`;
        });
    }
    return html`
      <select class="uk-select uk-form-small" name="species"
        .selectedIndex=${live(this.selectedSpecies)}
        @change="${this._selectSpecies}">
        <option value="">-- any --</option>
        ${options}
      </select>
    `;
  }

  // called when an strain is selected
  private _selectStrain(event: Event) {
    // @ts-ignore
    this.selectedStrain = event.target.selectedIndex;
  }

  // renders the strain selector
  private _renderStrainSelector() {
    let options = [html``];
    if (this.selectedSpecies) {
      options =
        this.formData
          .genuses[this.selectedGenus-1]
          .species[this.selectedSpecies-1]
          .strains.map(({strain}) => {
            return html`<option value="${strain}">${strain}</option>`;
          });
    }
    return html`
      <select class="uk-select uk-form-small" name="strain"
        .selectedIndex=${live(this.selectedStrain)}
        @change="${this._selectStrain}">
        <option value="">-- any --</option>
        ${options}
      </select>
    `
  }

  /** @ignore */
  // used by LisPaginatedSearchMixin to draw the search form part of template
  override renderForm() {

    // render the form's selectors
    const genusSelector = this._renderGenusSelector();
    const speciesSelector = this._renderSpeciesSelector();
    const strainSelector = this._renderStrainSelector();

    // render the form
    return html`
      <form class="uk-form-stacked">
        <fieldset class="uk-fieldset">
          <legend class="uk-legend">Gene Search</legend>
          <lis-alert-element closeable="true" ${ref(this._formAlertRef)} ?hidden=${!this._formAlertRef.value?.content}></lis-alert-element>
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
              <label class="uk-form-label" for="strain">Strain</label>
              ${strainSelector}
            </div>
          </div>
          <div class="uk-margin uk-grid-small" uk-grid>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="identifier">Identifier</label>
              <input class="uk-input" type="text" name="identifier"
                .value=${this.queryStringController.getParameter('identifier')}/>
              <span class="uk-text-small">e.g. Glyma.13G357700</span>
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="description">Description</label>
              <input class="uk-input" type="text" name="description"
                .value=${this.queryStringController.getParameter('description')}/>
              <span class="uk-text-small">e.g. protein disulfide isomerase-like protein</span>
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="family">Gene Family ID</label>
              <input class="uk-input" type="text" name="family"
                .value=${this.queryStringController.getParameter('family')}/>
              <span class="uk-text-small">e.g. L_HZ6G4Z</span>
            </div>
          </div>
          <div class="uk-margin">
            <button type="submit" class="uk-button uk-button-primary">Search</button>
          </div>
        </fieldset>
      </form>
    `;
  }

  // renders the location part or a result
  private _renderLocation(gene: any) {
    if (!gene.locations?.length) {
      return html``;
    }
    const [first, ..._] = gene.locations;
    let location = html``;
    if (first.chromosome !== undefined) {
      location = html`<b>chromosome location:</b> ${unsafeHTML(first.chromosome)}`;
    } else if (first.supercontig !== undefined) {
      location = html`<b>supercontig location:</b> ${unsafeHTML(first.supercontig)}`;
    } else {
      return html``;
    }
    return html`
      <div>
        ${location}:${ first.start }-${ first.end } (${ first.strand })
      </div>
    `;
  }

  // renders the gene family part of a result
  private _renderGeneFamily(gene: any) {
    if (!gene.geneFamilyAssignments?.length) {
      return html``;
    }
    const [first, ..._] = gene.geneFamilyAssignments;
    return html`
      <div>
        <b>gene family:</b> ${unsafeHTML(first)}
      </div>
    `;
  }

  // renders a single result as a row
  private _renderResult(gene: any) {

    const location = this._renderLocation(gene);
    const geneFamily = this._renderGeneFamily(gene);

    return html`
      <div>
        <div>
          <b>${unsafeHTML(gene.identifier)}</b> (${unsafeHTML(gene.name)}) <span class="uk-text-italic">${unsafeHTML(gene.genus)} ${unsafeHTML(gene.species)}</span> ${unsafeHTML(gene.strain)}
        </div>
        <div class="uk-text-italic">
          ${ gene.description }
        </div>
        ${location}
        ${geneFamily}
        <hr>
      </div>
    `;
  }

  /** @ignore */
  // used by LisPaginatedSearchMixin to draw the results part of template
  override renderResults() {
    return this.searchResults.map((gene) => this._renderResult(gene));
  }

}


declare global {
  interface HTMLElementTagNameMap {
    'lis-gene-search-element': LisGeneSearchElement;
  }
}
