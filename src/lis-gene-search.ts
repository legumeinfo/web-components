import {LitElement, html} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

import {LisSearchElement, LisSimpleTableElement, LisPaginationElement} from './core';
import {Gene} from './models';


type AlertModifier = 'primary' | 'success' | 'warning' | 'danger';


@customElement('lis-gene-search-element')
export class LisGeneSearchElement extends LitElement {

  // disable shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  // the search callback function; not an attribute because functions can't be
  // parsed from attributes
  @property({type: Function, attribute: false})
  searchFunction: Function = () => Promise.reject(new Error('No search function provided'));

  // messages sent to the user about search status
  @state()
  private _alertMessage: string = '';

  // the style of the alert element
  @state()
  private _alertModifier: AlertModifier = 'primary';

  // bind to the search element in the template
  @query('lis-search-element')
  _search!: LisSearchElement;

  // bind to the table element in the template
  @query('lis-simple-table-element')
  _table!: LisSimpleTableElement;

  // bind to the pagination element in the template
  @query('lis-pagination-element')
  _paginator!: LisPaginationElement;

  // invariant state
  private _geneAttributes = ['name', 'description']
  private _tableHeader = {name: 'Name', description: 'Description'};

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
          (genes: Gene[]) => this._searchSuccess(query, genes),
          (error: Error) => this._searchFailure(error),
        );
    }
  }

  private _searchSuccess(query: string, genes: Gene[]): void {
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
