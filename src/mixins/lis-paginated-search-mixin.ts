import {LitElement, html} from 'lit';
import {property, query, state} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

import {
  LisPaginationElement,
  LisSimpleTableElement,
} from '../core';
import {AlertModifier} from '../models';


// used to type constrain the super class
type Constructor<T = {}, Params extends any[] = any[]> =
  new (...args: Params) => T;


export type PaginatedSearchResults<SearchResult> = {
  hasNext?: boolean;
  results: SearchResult[];
};


// the search function
export type SearchFunction<SearchData, SearchResult> =
  (searchData: SearchData, page: number) => Promise<PaginatedSearchResults<SearchResult>>;


// define an interface for type casting because TypeScript can't infer
// private/protected members, i.e. it will throw a compiler error
export declare class LisPaginatedSearchElementInterface<SearchData, SearchResult> {
  // public properties
  searchFunction: SearchFunction<SearchData, SearchResult>;
  // protected properties
  protected resultAttributes: string[];
  protected tableHeader: Object;
  // can optionally be overridden
  protected formToObject(formData: FormData): SearchData;
  // "abstract" method, i.e. must be implemented in concrete class
  protected renderForm(): unknown;
}


// the mixin factory
export const LisPaginatedSearchMixin =
  // HACK: curried function because TypeScript doesn't support partial type
  // argument inference: https://github.com/microsoft/TypeScript/issues/26242
  <T extends Constructor<LitElement>> (superClass: T) => <SearchData, SearchResult>() => {

// the mixin class
class LisPaginatedSearchElement extends superClass {

  // disable shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  // the search callback function; not an attribute because functions can't be
  // parsed from attributes
  @property({type: Function, attribute: false})
  searchFunction: SearchFunction<SearchData, SearchResult> =
    () => Promise.reject(new Error('No search function provided'));

  // attributes of result objects in the concrete class
  @state()
  protected resultAttributes: string[] = [];

  // the tables headers to use in the concrete class
  @state()
  protected tableHeader: Object = {};

  // keep a copy of the search form data for pagination
  @state()
  private _data: SearchData | undefined = undefined;

  // messages sent to the user about search status
  @state()
  private _alertMessage: string = '';

  // the style of the alert element
  @state()
  private _alertModifier: AlertModifier = 'primary';

  // bind to the table element in the template
  @query('lis-simple-table-element')
  private _table!: LisSimpleTableElement;

  // bind to the pagination element in the template
  @query('lis-pagination-element')
  private _paginator!: LisPaginationElement;

  // converts the given FormData instance into an Object that will be passed to
  // the searchFunction
  // this is a default implementation and should be override in the concrete
  // class if any ambiguity in the FormData needs to be resolved
  protected formToObject(formData: FormData): SearchData {
    return Object.fromEntries(formData) as unknown as SearchData;
  }

  // called when a search term is submitted
  private _updateData(e: CustomEvent): void {
    e.preventDefault();
    e.stopPropagation();  // we'll emit our own event
    this._data = this.formToObject(e.detail.data);
    this._paginator.page = 1;
    this._search();
  }

  // called when the page changes
  private _changePage(e: CustomEvent): void {
    e.preventDefault();
    e.stopPropagation();  // we'll emit our own event
    this._search();
  }

  // performs a search via an external function
  private _search(): void {
    if (this._data !== undefined) {
      const page = this._paginator.page;
      const message = `<span uk-spinner></span> Loading page ${page}`;
      this._setAlert(message, 'primary');
      this.searchFunction(this._data, page)
        .then(
          (results: PaginatedSearchResults<SearchResult>) => this._searchSuccess(results),
          (error: Error) => this._searchFailure(error),
        );
    }
  }

  // updates the table and alert with the search result data
  private _searchSuccess(paginatedResults: PaginatedSearchResults<SearchResult>): void {
    // destruct the paginated search result
    const {hasNext, results} = {
        // provide a default value for hasNext based on if there's any results
        hasNext: Boolean(paginatedResults.results.length),
        ...paginatedResults,
      };
    // report the success in the alert
    const plural = results.length == 1 ? '' : 's';
    const message = `${results.length} result${plural} found`;
    const modifier = results.length ? 'success' : 'warning';
    this._setAlert(message, modifier);
    // display the results in the table
    this._table.data = results;
    // update the pagination element
    this._paginator.hasNext = hasNext;
  }

  // updates the alert with an error message and throws the actual error so it
  // will appear in the console/debugger
  private _searchFailure(error: Error): void {
    const message = 'Search failed';
    this._setAlert(message, 'danger');
    throw error;
  }

  // sets the alert element style and content
  private _setAlert(message: string, modifier: AlertModifier): void {
    this._alertMessage = message;
    this._alertModifier = modifier;
  }

  // generates an alert element using the current alert state
  private _renderAlert(): unknown {
    if (!this._alertMessage) {
      return html``;
    }
    return html`
      <div class="uk-alert uk-alert-${this._alertModifier}">
        <p>${unsafeHTML(this._alertMessage)}</p>
      </div>
    `;
  }

  // a method the concrete class must implement to render the form
  protected renderForm(): unknown {
    throw new Error('Method not implemented');
  }

  override render(): unknown {

    // render the template parts
    const form = this.renderForm();
    const alert = this._renderAlert();

    // the template
    return html`

      <lis-form-wrapper-element @submit="${this._updateData}">
        ${form}
      </lis-form-wrapper-element>

      ${alert}

      <lis-simple-table-element
        caption="Search Results"
        .dataAttributes=${this.resultAttributes}
        .header=${this.tableHeader}>
      </lis-simple-table-element>

      <lis-pagination-element @pageChange=${this._changePage}></lis-pagination-element>

    `;
  }

}

  return LisPaginatedSearchElement as
    unknown as  // TODO: get rid of this intermediate cast
    Constructor<LisPaginatedSearchElementInterface<SearchData, SearchResult>> & T;

};
