import {LitElement, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';

import {LisPaginatedSearchMixin, PaginatedSearchOptions} from './mixins';


/**
 * The data that will be passed to the search function by the
 * {@link LisQTLSearchElement | `LisQTLSearchElement`} class when a search is
 * performed.
 */
export type QTLSearchData = {
    query: string;
};


/**
 * A single result of a QTL search performed by the
 * {@link LisQTLSearchElement | `LisQTLSearchElement`} class.
 */
export type QTLSearchResult = {
    trait_name: string;
    identifier: string;
    linkageGroup_geneticMap_identifier: string;
    linkageGroup_identifier: string;
    start: number;
    end: number;
    markerNames: string;
};


/**
 * The signature of the function the
 * {@link LisQTLSearchElement | `LisQTLSearchElement`} class requires for
 * performing a QTL search.
 *
 * @param query The search term in the input element when the search form was
 * submitted.
 * @param page What page of results the search is for. Will always be 1 when a
 * new search is performed.
 * @param options Optional parameters that aren't required to perform a QTL
 * search but may be useful.
 *
 * @returns A {@link !Promise | `Promise`} that resolves to an
 * {@link !Array | `Array`} of {@link QTLSearchResult | `QTLSearchResult`}
 * objects.
 */
export type QTLSearchFunction =
    (query: string, page: number, options: PaginatedSearchOptions) => Promise<Array<QTLSearchResult>>;


/**
 * @htmlElement `<lis-qtl-search-element>`
 *
 * A Web Component that provides an interface for performing keyword searches
 * for QTLs and displaying results in a paginated table. Note that the
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
 * must be set on a `<lis-qtl-search-element>` tag's instance of the
 * {@link LisQTLSearchElement | `LisQTLSearchElement`} class. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-qtl-search-element id="qtl-search"></lis-qtl-search-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // a site-specific function that sends a request to a QTL search API
 *   function getQTLs(searchText, page, {abortSignal}) {
 *     // returns a Promise that resolves to a search result object
 *   }
 *   // get the QTL search element
 *   const searchElement = document.getElementById('qtl-search');
 *   // set the element's searchFunction property
 *   searchElement.searchFunction = getQTLs;
 * </script>
 * ```
 */
@customElement('lis-qtl-search-element')
export class LisQTLSearchElement extends
LisPaginatedSearchMixin(LitElement)<QTLSearchData, QTLSearchResult>() {

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
            'trait_name',
            'identifier',
            'linkageGroup_geneticMap_identifier',
            'linkageGroup_identifier',
            'start',
            'end',
            'markerNames'
        ];
        this.tableHeader = {
            'trait_name': 'Trait',
            'identifier': 'QTL',
            'linkageGroup_geneticMap_identifier': 'Genetic Map',
            'linkageGroup_identifier': 'Linkage Group',
            'start': 'Start',
            'end': 'End',
            'markerNames': 'Markers'
        };
    }

    /** @ignore */
    // used by LisPaginatedSearchMixin to draw the template
    override renderForm() {
        return html`
<form>
<fieldset class="uk-fieldset">
<legend class="uk-legend">QTL trait name search (e.g. flower)</legend>
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
        'lis-qtl-search-element': LisQTLSearchElement;
    }
}
