import {LitElement, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';

import {LisPaginatedSearchMixin, PaginatedSearchOptions} from './mixins';

// RESULT (up to arrays that are not flattened):
//   "name": "Gcy10g022939",
//   "identifier": "glycy.G1267.gnm1.ann1.Gcy10g022939",
//   "description": "protein disulfide isomerase-like protein; IPR005746 (Thioredoxin), IPR011679 (Endoplasmic reticulum, protein ERp29, C-terminal), IPR012336 (Thioredoxin-like fold); GO:0005783 (endoplasmic reticulum), GO:0006662 (glycerol ether metabolic process), GO:0015035 (protein disulfide oxidoreductase activity), GO:0016853 (isomerase activity), GO:0045454 (cell redox homeostasis)",
//   "organism_genus": "Glycine",
//   "organism_species": "cyrtoloba",
//   "strain_identifier": "G1267",

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
    organism_genus: string;
    organism_species: string;
    strain_identifier: string;
};


/**
 * The signature of the function the
 * {@link LisGeneSearchElement | `LisGeneSearchElement`} class requires for
 * performing a gene search.
 *
 * @param genus The organism genus from the search form genus selector
 * @param description The gene description keyword from the form description text input
 * @param page What page of results the search is for. Will always be 1 when a
 * new search is performed.
 * @param options Optional parameters that aren't required to perform a gene
 * search but may be useful.
 *
 * @returns A {@link !Promise | `Promise`} that resolves to an
 * {@link !Array | `Array`} of {@link GeneSearchResult | `GeneSearchResult`}
 * objects.
 */
export type GeneSearchFunction = (
    genus: string,
    description: string,
    page: number, options: PaginatedSearchOptions) => Promise<Array<GeneSearchResult>>;


/**
 * @htmlElement `<lis-gene-search-element>`
 *
 * A Web Component that provides an interface for performing keyword searches
 * for genes and displaying results in a paginated table. Note that the
 * component saves its state to the URL query string parameters and a search
 * will be automatically performed if the parameters are present when the
 * componnent is loaded. The component uses the
 * {@link mixins!LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin. See
 * the mixin docs for further details.
 *
 * @queryStringParameters
 * - **query:** The text in the query field of the search form.
 * - **page:** What page of results is loaded.
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
 *   // get the gene search element
 *   const searchElement = document.getElementById('gene-search');
 *   // set the element's resultAttributes property
 *   searchElement.resultAttributes = ["name", "identifier", "description", "organism_genus", "organism_species", "strain_identifier"];
 *   // set the element's tableHeader property
 *   searchElement.tableHeader = {
 *     name: "Name",
 *     identifier: "Identifier",
 *     description: "Description",
 *     organism_genus: "Genus",
 *     organism_species: "Species",
*      strain_identifier: "Strain"
 *   };
 * </script>
 * ```
 *
 * @example 
 * The {@link LisGeneSearchElement | `LisGeneSearchElement`} class inherits the
 * {@link resultAttributes | `resultAttributes`} and
 * {@link tableHeader | `tableHeader`} properties from
 * {@link mixins!LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin. These are
 * used to define what attributes of the results provided by the
 * {@link searchFunction | `searchFunction`} will be shown in the results table and
 * what their corresponding headers will be in the table. These properties can be
 * overridden via JavaScript. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-gene-search-element id="gene-search"></lis-gene-search-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // get the gene search element
 *   const searchElement = document.getElementById('gene-search');
 *   // set the element's resultAttributes property
 *   searchElement.resultAttributes = ["name", "description", "link"];
 *   // set the element's tableHeader property
 *   searchElement.tableHeader = {
 *     name: "Name",
 *     description: "Description",
 *     link: "Link",
 *   };
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

    constructor() {
        super();
        // configure query string parameters
        this.requiredQueryStringParams = ['genus', 'description'];
        // configure results table
        this.resultAttributes = [
            'name',
            'identifier',
            'description',
            'organism_genus',
            'organism_species',
            'strain_identifier'
        ];
        this.tableHeader = {
            name: 'Name',
            identifier: 'Identifier',
            description: 'Description',
            organism_genus: 'Genus',
            organism_species: 'Species',
            strain_identifier: 'Accession'
        };
    }

    /** @ignore */
    // used by LisPaginatedSearchMixin to draw the template
    override renderForm() {
        return html`
        <form>
          <fieldset class="uk-fieldset uk-flex">
            <div class="uk-padding-small">
              <label class="uk-label">Genus</label><br/>
              <select class="uk-select uk-form-small" name="genus">
                <!-- TEMPORARILY HARDCODED -->
                <option value="">-- any --</option>
                <option value="Aeschynomene">Aeschynomene</option>
                <option value="Arachis">Arachis</option>
                <option value="Cajanus">Cajanus</option>
                <option value="Cercis">Cercis</option>
                <option value="Cicer">Cicer</option>
                <option value="Glycine">Glycine</option>
                <option value="Lens">Lens</option>
                <option value="Lotus">Lotus</option>
                <option value="Lupinus">Lupinus</option>
                <option value="Medicago">Medicago</option>
                <option value="Phaseolus">Phaseolus</option>
                <option value="Pisum">Pisum</option>
                <option value="Trifolium">Trifolium</option>
                <option value="Vigna">Vigna</option>
              </select>
            </div>
            <div class="uk-padding-small">
              <label class="uk-label">species</label><br/>
              <select class="uk-select uk-form-small" name="species">
                <option value="">-- any --</option>
                <option value="">TO DO</option>
              </select>
            </div>
            <div class="uk-padding-small">
              <label class="uk-label">accession</label><br/>
              <select class="uk-select uk-form-small" name="strain">
                <option value="">-- any --</option>
                <option value="">TO DO</option>
              </select>
            </div>
            <div class="uk-padding-small">
              <label class="uk-label">identifier</label><br/>
              <input class="uk-input uk-form-small uk-form-width-medium" name="identifier"/><br/>
              <i>e.g. Glyma.13G357700</i>
            </div>
            <div class="uk-padding-small">
              <label class="uk-label">description</label><br/>
              <input class="uk-input uk-form-small uk-form-width-large" name="description"/><br/>
              <i>e.g. protein disulfide isomerase-like protein</i>
            </div>
            <div class="uk-padding-small">
              <label class="uk-label">gene family ID</label><br/>
              <input class="uk-input uk-form-small uk-form-width-small" name="geneFamilyIdentifier"/><br/>
              <i>e.g. L_HZ6G4Z</i>
            </div>
            <div class="uk-padding-small">
              <br/>
              <button class="uk-button uk-button-primary uk-form-small" type="submit">SEARCH</button>
            </div>
          </fieldset>
        </form>
`;
    }

}


declare global {
    interface HTMLElementTagNameMap {
        'lis-gene-search-element': LisGeneSearchElement;
    }
}
