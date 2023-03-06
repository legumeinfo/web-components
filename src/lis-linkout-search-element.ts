import {LitElement, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';

import {LisPaginatedSearchMixin, PaginatedSearchOptions} from './mixins';


/**
 * The data that will be passed to the search function by the
 * {@link LisLinkoutSearchElement | `LisLinkoutSearchElement`} class when a search is
 * performed.
 */
export type LinkoutSearchData = {
    query: string;
};


/**
 * A single result of a gene search performed by the
 * {@link LisLinkoutSearchElement | `LisLinkoutSearchElement`} class.
 */
export type LinkoutSearchResult = {
    name: string;
    description: string;
};


/**
 * The signature of the function the
 * {@link LisLinkoutSearchElement | `LisLinkoutSearchElement`} class requires for
 * performing a gene search.
 *
 * @param query The search term in the input element when the search form was
 * submitted.
 * @param page What page of results the search is for. Will always be 1 when a
 * new search is performed.
 * @param options Optional parameters that aren't required to perform a gene
 * search but may be useful.
 *
 * @returns A {@link !Promise | `Promise`} that resolves to an
 * {@link !Array | `Array`} of {@link LinkoutSearchResult | `LinkoutSearchResult`}
 * objects.
 */
export type LinkoutSearchFunction =
    (query: string, page: number, options: PaginatedSearchOptions) => Promise<Array<LinkoutSearchResult>>;


/**
 * @htmlElement `<lis-linkout-search-element>`
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
 * must be set on a `<lis-linkout-search-element>` tag's instance of the
 * {@link LisLinkoutSearchElement | `LisLinkoutSearchElement`} class. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-linkout-search-element id="gene-search"></lis-linkout-search-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // a site-specific function that sends a request to a gene search API
 *   function getGenes(searchText, page, {abortSignal}) {
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
 * The {@link LisLinkoutSearchElement | `LisLinkoutSearchElement`} class inherits the
 * {@link resultAttributes | `resultAttributes`} and
 * {@link tableHeader | `tableHeader`} properties from
 * {@link mixins!LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin. These are
 * used to define what attributes of the results provided by the
 * {@link searchFunction | `searchFunction`} will be shown in the results table and
 * what their corresponding headers will be in the table. These properties can be
 * overridden via JavaScript. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-linkout-search-element id="gene-search"></lis-linkout-search-element>
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
@customElement('lis-linkout-search-element')
export class LisLinkoutSearchElement extends
LisPaginatedSearchMixin(LitElement)<LinkoutSearchData, LinkoutSearchResult>() {

    /** @ignore */
    // used by Lit to style the Shadow DOM
    // not necessary but exclusion breaks TypeDoc
    static override styles = css``;

    constructor() {
        super();
        // configure query string parameters
        this.requiredQueryStringParams = ['query'];
        // configure results table
        this.resultAttributes = [
            'name',
            'description'
        ];
        this.tableHeader = {
            name: 'Name',
            description: 'Description'
        };
    }

    /** @ignore */
    // used by LisPaginatedSearchMixin to draw the template
    override renderForm() {
        return html`
<form>
<fieldset class="uk-fieldset">
<legend class="uk-legend">Gene description search (e.g. photosystem II)</legend>
<div class="uk-margin">
<input
name="query"
class="uk-input"
type="text"
placeholder="Input"
aria-label="Input"
.value=${this.queryStringController.getParameter('query')}>
</div>
<div class="uk-margin">
<button type="submit" class="uk-button uk-button-primary">Search</button>
</div>
</fieldset>
</form>
`;
    }

}


declare global {
    interface HTMLElementTagNameMap {
        'lis-linkout-search-element': LisLinkoutSearchElement;
    }
}
