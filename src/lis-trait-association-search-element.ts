import {LitElement, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {LisPaginatedSearchMixin, PaginatedSearchOptions} from './src/mixins'
import {property, state} from 'lit/decorators.js';
import {LisCancelPromiseController} from "./src/controllers";
import {LisLoadingElement} from "./src/core";
import {createRef, ref, Ref} from "lit/directives/ref.js";
import {live} from 'lit/directives/live.js';


/**
 * The data used to construct the search form in the
 * {@link LisTraitAssociationSearchElement | `LisTraitAssociationSearchElement`} template.
 */
export type AssociationSearchFormData = {
    genuses: {
        genus: string,
        species: {
            species: string
        }[],
    }[];
}


/**
 * Optional parameters that may be given to a form data function. The
 * {@link !AbortSignal | `AbortSignal`} instance will emit if a new function is provided
 * before the current function completes. This signal should be used to cancel in-flight
 * requests if the external API supports it.
 */
export type AssociationSearchFormDataOptions = {abortSignal?: AbortSignal};


export type AssociationFormDataFunction =
    (options: AssociationSearchFormDataOptions) => Promise<AssociationSearchFormData>;



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
 * Both GWAS and QTL results are returned in this format.
 *
 *
 */
export type TraitAssociationResult = {
    identifier: string;
    synopsis: string;
    description: string;
    trait_name: string;
    genotypes: string;
};


/**
 * Search function for the {@link LisTraitAssociationSearchElement | `LisTraitAssociationSearchElement`} class.
 * Shared by both GWAS and QTL searches.
 *
 * @param query The search term in the input element when the search form was submitted.
 * @param page What page of results the search is for. Will always be 1 when a new search is performed.
 * @param options Optional parameters that aren't required to perform a GWAS search but may be useful.
 *
 * @returns A {@link !Promise | `Promise`} that resolves to an
 * {@link !Array | `Array`} of {@link TraitAssociationResult | `TraitAssociationResult`}
 * objects.
 */
export type AssociationSearchFunction =
    (
        searchData: {
            genus: string,
            species: string,
            terms: string,
            type: string
        },
        page: number,
        options: PaginatedSearchOptions
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
 * - **query:** The gwas id in the query field of the search form.
 * - **page:** What page of results is loaded. Starts at 1.
 */

@customElement('lis-trait-association-search')
export class LisTraitAssociationSearchElement extends
    LisPaginatedSearchMixin(LitElement)<AssociationSearchData, TraitAssociationResult>() {


    //Available study types
    private studyTypes = ['GWAS', 'QTL'];

    /** @ignore */
        // used by Lit to style the Shadow DOM
        // not necessary but exclusion breaks TypeDoc
    static override styles = css``;

    /**
     * Property to only show a single genus in the search form.
     * Useful for sites that only have a single genus like SoyBase.
     */
    @property({type: String})
    only: string = '';

    /**
     * The data used to construct the search form in the template.
     *
     * @attribute
     */
    @property()
    formData: AssociationSearchFormData = {genuses: []}

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
    protected formDataCancelPromiseController = new LisCancelPromiseController(this);

    // bind to the loading element in the template
    private _formLoadingRef: Ref<LisLoadingElement> = createRef();


    @property({type: Function, attribute: false})
    formDataFunction: AssociationFormDataFunction =
        () => Promise.reject(new Error('No form data function provided'));



    constructor() {
        super();
        // configure query string parameters
        this.requiredQueryStringParams = [
            ['genus'],
            ['genus', 'species'],
            ['terms'],
            ['type'],
        ];
        // initialize the form data with querystring parameters so a search can be performed
        // before the actual form data is loaded
        const formData: AssociationSearchFormData = {genuses: []};
        const genus = this.queryStringController.getParameter('genus');
        if (genus) {
            formData.genuses.push({genus, species: []});
            const species = this.queryStringController.getParameter('species');
            if (species) {
                formData
                    .genuses[0]
                    .species.push({species});
            }
        }
        this.formData = formData;
        // set the selector values before the DOM is updated when the querystring parameters change
        this.queryStringController.addPreUpdateListener((_) => {
            this._initializeSelections();
        });
    }

    // called after every component update, e.g. when a property changes
    override updated(changedProperties: Map<string, any>) {
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
        const options = {abortSignal: this.formDataCancelPromiseController.abortSignal};
        const formDataPromise = this.formDataFunction(options);
        // call the cancellable function
        this.formDataCancelPromiseController.wrapPromise(formDataPromise)
            .then(
                (formData) => {
                    this._formLoadingRef.value?.success();
                    this.formData = formData;
                },
                (error: Error) => {
                    // do nothing if the request was aborted
                    if ((error as any).type !== 'abort') {
                        this._formLoadingRef.value?.failure();
                        throw error;
                    }
                },
            );
    }

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
    }
    // called when a genus is selected
    private _selectGenus(event: Event) {
        // @ts-ignore
        this.selectedGenus = event.target.selectedIndex;
        this.selectedSpecies = 0;
    }

    // renders the genus selector
    private _renderGenusSelector(onlyGenus: string) {
        // if onlyGenus is set, render a disabled select element with the onlyGenus value as the selected and only option.
        if (onlyGenus.length > 0) {
            const genus = this.formData.genuses.find(({genus}) => genus === onlyGenus.charAt(0).toUpperCase() + onlyGenus.slice(1));
            if (genus) {
                this.selectedGenus = this.formData.genuses.indexOf(genus)+1;
                return html`
          <select class="uk-select uk-form-small" name="genus" disabled>
            <option value="${genus.genus}" selected>${genus.genus}</option>
          </select>
        `;
            }
        }
        // otherwise, render a normal select element
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


    /**
     * Handles the selection of a type (GWAS or QTL)
     * @param event
     * @private
     */
    private _selectType(event: Event) {
        // @ts-ignore
        this.selectedType = event.target.selectedIndex;
    }

    // renders the type selector
    private _renderTypeSelector() {
        const options = this.studyTypes.map((type) => {
            return html`<option value="${type}">${type}</option>`;
        });
        return html`
      <select class="uk-select uk-form-small" name="type"
        .selectedIndex=${live(this.selectedType)}
        @change="${this._selectType}">
        <option value="">-- any --</option>
        ${options}
      </select>
    `;
    }


    /** @ignore */
    // used by LisPaginatedSearchMixin to draw the search form part of template
    override renderForm() {
        // render the form's selectors
        const genusSelector = this._renderGenusSelector(this.only);
        const speciesSelector = this._renderSpeciesSelector();
        const typeSelector = this._renderTypeSelector();

        /**
         * Genus [dropdown: Aeschynomene Apios Arachis Bauhinia Cajanus Cercis Chamaecrista Cicer Faidherbia Glycine Lablab Lens Lotus Lupinus]
         *
         * Species [dropdown, depending on Genus, e.g. acutifolius, lunatus, vulgaris]
         *
         * Trait terms [free-text entry, e.g. flower, maturity, height]
         *
         * Study type  [dropdown: GWAS, QTL]
         */


        return html`
                  <form class="uk-form-stacked uk-inline">
        <fieldset class="uk-fieldset">
          <legend class="uk-legend">Gene Search</legend>
          <lis-loading-element ${ref(this._formLoadingRef)}></lis-loading-element>
          <div class="uk-margin uk-grid-small" uk-grid>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="genus">Genus</label>
              ${genusSelector}
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="species">Species</label>
              ${speciesSelector}
            </div>
          </div>
          <div class="uk-margin uk-grid-small" uk-grid>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="identifier">Terms</label>
              <input class="uk-input" type="text" name="terms"
                .value=${this.queryStringController.getParameter('terms')}/>
              <span class="uk-text-small">e.g. R8 full maturity</span>
            </div>
            <div class="uk-width-1-3@s">
                <label class="uk-form-label" for="type">Type</label>
                ${typeSelector}
            </div>
          </div>
          <div class="uk-margin">
            <button type="submit" class="uk-button uk-button-primary">Search</button>
          </div>
        </fieldset>
      </form>
        `;
    }
}