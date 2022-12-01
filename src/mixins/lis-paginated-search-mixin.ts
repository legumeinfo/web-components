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


// the search function
//export type SearchFunction<SearchObject, SearchResult> =
//  (searchData: SearchObject, page: number) => Promise<SearchResult[]>;
export type SearchFunction =
  (searchData: any, page: number) => Promise<any[]>;


// define an interface for type casting because TypeScript can't infer
// private/protected members, i.e. it will throw a compiler error
//export declare class LisPaginatedSearchElementInterface<SearchObject, SearchResult> {
export declare class LisPaginatedSearchElementInterface {
  // public properties
  //searchFunction: SearchFunction<SearchResult>;
  searchFunction: SearchFunction;
  // protected properties
  protected resultAttributes: string[];
  protected tableHeader: Object;
  // can optionally be overridden
  //protected formToObject(formData: FormData): SearchObject;
  protected formToObject(formData: FormData): any;
  // "abstract" method, i.e. must be implemented in concrete class
  protected renderForm(): unknown;
  // private properties
  //private _data: Object;
  //private _alertMessage: string;
  //private _alertModifier: AlertModifier;
  //private _table: LisSimpleTableElement;
  //private _paginator: LisPaginationElement;
  // private methods
  //private _updateData(e: CustomEvent): void;
  //private _changePage(e: CustomEvent): void;
  //private _search(): void;
  //private _searchSuccess(results: any[]): void;
  //private _searchFailure(error: Error): void;
  //private _setAlert(): void;
  //private _renderAlert(): unknown;
}


// the mixin factory
export const LisPaginatedSearchMixin =
  <T extends Constructor<LitElement>>(superClass: T) => {

// the mixin class
//class LisPaginatedSearchElement<SearchObject, SearchResult> extends superClass {
class LisPaginatedSearchElement extends superClass {

  //constructor(...rest: any[]) {
  //  super(...rest);
  //}

  // disable shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  // the search callback function; not an attribute because functions can't be
  // parsed from attributes
  @property({type: Function, attribute: false})
  //searchFunction: SearchFunction<SearchResult> =
  //  () => Promise.reject(new Error('No search function provided'));
  searchFunction: SearchFunction =
    () => Promise.reject(new Error('No search function provided'));

  // attributes of result objects in the concrete class
  @state()
  protected resultAttributes: string[] = [];

  // the tables headers to use in the concrete class
  @state()
  protected tableHeader: Object = {};

  // keep a copy of the search form data for pagination
  @state()
  private _data: Object | undefined = undefined;

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
  //protected formToObject(formData: FormData): SearchObject {
  protected formToObject(formData: FormData): any {
    return Object.fromEntries(formData);
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
          //(results: SearchResult[]) => this._searchSuccess(results),
          (results: any[]) => this._searchSuccess(results),
          (error: Error) => this._searchFailure(error),
        );
    }
  }

  // updates the table and alert with the search result data
  //private _searchSuccess(results: SearchResult[]): void {
  private _searchSuccess(results: any[]): void {
    const plural = results.length == 1 ? '' : 's';
    const message = `${results.length} result${plural} found`;
    const modifier = results.length ? 'success' : 'warning';
    this._setAlert(message, modifier);
    this._table.data = results;
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

  // TODO: how do we get rid of the "unknown" cast in the middle?
  return LisPaginatedSearchElement as unknown as Constructor<LisPaginatedSearchElementInterface> & T;

};
