import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';

import {LisPaginatedSearchMixin} from './mixins';


/**
 * The data that will be passed to the search function by the
 * {@link LisGeneSearchElement} class when a search is performed.
 */
export type GeneSearchData = {
  query: string;
};


/**
 * A single result of a gene search performed by the
 * {@link LisGeneSearchElement} class.
 */
export type GeneSearchResult = {
  name: string;
  description: string;
};


/**
 * The signature of the function the
 * {@link LisGeneSearchElement | `LisGeneSearchElement`} class requires for
 * performing a gene search.
 *
 * @param query The search term in the input element when the search form was
 * submitted.
 * @param page What page of results the search is for. Will always be 1 when a
 * new search is performed.
 *
 * @returns A {@link !Promise | `Promise`} that resolves to an
 * {@link !Array | `Array`} of {@link GeneSearchResult | `GeneSearchResult`}
 * objects.
 */
export type GeneSearchFunction = (query: string, page: number) => Promise<Array<GeneSearchResult>>;


/**
 * @htmlElement `<lis-gene-search-element>`
 *
 * A Web Component that provides an interface for performing gene searches and
 * displays results in a paginated table.
 *
 * @example 
 * {@link !HTMLElement | `HTMLElement`} properties can only be set via
 * JavaScript. This means the {@link searchFunction | `searchFunction`} property
 * must be set on a `<lis-gene-search-element>` tag's instance of the
 * {@link LisGeneSearchElement | `LisGeneSearchElement`}. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-gene-search-element id="gene-search"></lis-gene-search-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // a site-specific function that sends a request to a gene search API
 *   function getGenes(searchText, page=1) {
 *     // returns a Promise that resolves to a list of genes
 *   }
 *   // get the gene search element
 *   const searchElement = document.getElementById('gene-search');
 *   // set the element's searchFunction property
 *   searchElement.searchFunction = getGenes;
 * </script>
 * ```
 */
@customElement('lis-gene-search-element')
export class LisGeneSearchElement extends
LisPaginatedSearchMixin(LitElement)<GeneSearchData, GeneSearchResult>() {

  constructor() {
    super();
    // configure query string parameters
    this.requiredQueryStringParams = ['query'];
    // configure results table
    this.resultAttributes = ['name', 'description'];
    this.tableHeader = {name: 'Name', description: 'Description'};
  }

  /** @ignore */
  // used by LisPaginatedSearchMixin to draw the template
  override renderForm() {
    return html`
      <form>
        <fieldset class="uk-fieldset">
          <legend class="uk-legend">Gene search</legend>
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
    'lis-gene-search-element': LisGeneSearchElement;
  }
}
