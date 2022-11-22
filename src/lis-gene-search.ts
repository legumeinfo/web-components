import {LitElement, html, css} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

import {LisSearchElement, LisSimpleTableElement, LisPaginationElement} from './core';


type AlertModifier = 'primary' | 'success' | 'warning' | 'danger';

/**
 * A single result of a gene search performed by the
 * {@link LisGeneSearchElement} class.
 */
export type GeneSearchResult = {name: string; description: string};


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
export class LisGeneSearchElement extends LitElement {

  /** @ignore */
  // used by Lit to style the Shadow DOM
  // not necessary but exclusion breaks TypeDoc
  static override styles = css``;

  /** @ignore */
  // disable Shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  /**
   * The function that should be used to perform searches.
   *
   * @throws Will throw an error if not set when a search is performed.
   */
  // not an attribute because functions can't be parsed from attributes
  @property({type: Function, attribute: false})
  searchFunction: GeneSearchFunction = () => Promise.reject(new Error('No search function provided'));

  // messages sent to the user about search status
  @state()
  private _alertMessage: string = '';

  // the style of the alert element
  @state()
  private _alertModifier: AlertModifier = 'primary';

  // bind to the search element in the template
  @query('lis-search-element')
  private _search!: LisSearchElement;

  // bind to the table element in the template
  @query('lis-simple-table-element')
  private _table!: LisSimpleTableElement;

  // bind to the pagination element in the template
  @query('lis-pagination-element')
  private _paginator!: LisPaginationElement;

  // invariant state
  private readonly _geneAttributes = ['name', 'description']
  private readonly _tableHeader = {name: 'Name', description: 'Description'};

  // called when a search term is submitted
  private _updateTerm(e: CustomEvent) {
    e.preventDefault();
    e.stopPropagation();  // we'll emit our own event
    this._paginator.page = 1;
    this._geneSearch();
  }

  // called when the page changes
  private _changePage(e: CustomEvent) {
    e.preventDefault();
    e.stopPropagation();  // we'll emit our own event
    this._geneSearch();
  }

  // performs a search via an external function
  private _geneSearch() {
    if (this._search.input) {
      const query = this._search.input;
      const page = this._paginator.page;
      const message = `<span uk-spinner></span> Loading page ${page} for "${query}"`;
      this._setAlert(message, 'primary');
      this.searchFunction(query, page)
        .then(
          (genes: GeneSearchResult[]) => this._searchSuccess(query, genes),
          (error: Error) => this._searchFailure(error),
        );
    }
  }

  private _searchSuccess(query: string, genes: GeneSearchResult[]): void {
    const plural = genes.length == 1 ? '' : 's';
    const message = `${genes.length} gene${plural} found for "${query}"`;
    const modifier = genes.length ? 'success' : 'warning';
    this._setAlert(message, modifier);
    this._table.data = genes;
  }

  private _searchFailure(error: Error): void {
    const message = 'Gene search failed';
    this._setAlert(message, 'danger');
    throw error;
  }

  private _setAlert(message: string, modifier: AlertModifier): void {
    this._alertMessage = message;
    this._alertModifier = modifier;
  }

  private _getAlert() {
    if (!this._alertMessage) {
      return html``;
    }
    return html`
      <div class="uk-alert uk-alert-${this._alertModifier}">
        <p>${unsafeHTML(this._alertMessage)}</p>
      </div>
    `;
  }

  /** @ignore */
  // used by Lit to draw the template
  override render() {

    const alert = this._getAlert();

    return html`

      <lis-search-element
        legend="Search for genes by keyword"
        @submit="${this._updateTerm}">
      </lis-search-element>

      ${alert}

      <lis-simple-table-element
        caption="Search Results"
        .dataAttributes=${this._geneAttributes}
        .header=${this._tableHeader}>
      </lis-simple-table-element>

      <lis-pagination-element @pageChange=${this._changePage}></lis-pagination-element>

    `;
  }

}


declare global {
  interface HTMLElementTagNameMap {
    'lis-gene-search-element': LisGeneSearchElement;
  }
}
