import {LitElement, css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

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
 * The type signature of a function that may be used to load the data used to construct
 * the search form in the {@link LisGeneSearchElement | `LisGeneSearchElement`} template.
 */
export type GeneFormDataFunction = () => Promise<GeneSearchFormData>;


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
  locations: {chromosome: string, start: number, end: number, strand: string},
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
 * the function immediately and report the loading status via an alert element.
 * Note that this method can only be used after the component is loaded. For example:
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
 *   // wait for all elements to be loaded
 *   window.onload = (event) => {
 *     // get the gene search element
 *     const geneSearchElement = document.getElementById('gene-search');
 *     // set the element's formDataFunction property
 *     geneSearchElement.formDataFunction = getGeneFormData;
 *   }
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
   * An optional setter that can be used to load the form data via an external function.
   * If used, the loading status of the data will be displayed in an alert element.
   *
   * @attribute
   */
  // NOTE: unlike the GeneSearchFunction, this property is not protected from race
  // conditions
  set formDataFunction(getFormData: GeneFormDataFunction) {
    this._alertFormDataLoading();
    getFormData()
      .then(
        (formData) => {
          this._alertFormDataSuccess();
          this.formData = formData;
        },
        this._alertFormDataFailure
      );

  }

  // the selected index of the genus select element
  @state()
  private selectedGenus: number = 0;

  // the selected index of the species select element
  @state()
  private selectedSpecies: number = 0;

  // the selected index of the strain select element
  @state()
  private selectedStrain: number = 0;

  // bind to the alert element in the template
  private _formAlertRef: Ref<LisAlertElement> = createRef();

  constructor() {
    super();
    // configure query string parameters
    //this.requiredQueryStringParams = ['genus', 'description'];
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
        .selectedIndex=${this.selectedGenus}
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
        .selectedIndex=${this.selectedSpecies}
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
        .selectedIndex=${this.selectedStrain}
        @chnage="${this._selectStrain}">
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
              <input class="uk-input" type="text" name="identifier"/><br/>
              <span class="uk-text-small">e.g. Glyma.13G357700</span>
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="description">Description</label>
              <input class="uk-input" type="text" name="description"/><br/>
              <span class="uk-text-small">e.g. protein disulfide isomerase-like protein</span>
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="geneFamilyIdentifier">Gene Family ID</label>
              <input class="uk-input" type="text" name="geneFamilyIdentifier"/><br/>
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
    return html`
      <div>
        <b>location:</b> ${ first.chromosome }:${ first.start }-${ first.end } (${ first.strand })
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
        <b>gene family:</b> ${ first }
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
          <b>${ gene.identifier }</b> (${ gene.name }) <span className="uk-text-italic">${ gene.genus } ${ gene.species }</span> ${ gene.strain }
        </div>
        <div className="uk-text-italic">
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
