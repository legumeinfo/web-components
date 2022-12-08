import {LitElement, html} from 'lit';
import {property, query, state} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

import {
  LisCancelPromiseController,
  LisDomContentLoadedController,
  LisQueryStringParametersController,
} from '../controllers';
import {
  LisFormWrapperElement,
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

// optional parameters that may be given to a search
export type SearchOptions = {signal?: AbortSignal};

// the search function
export type SearchFunction<SearchData, SearchResult> =
  (searchData: SearchData, page: number, options: SearchOptions) =>
    Promise<PaginatedSearchResults<SearchResult>>;


// define an interface for type casting because TypeScript can't infer
// private/protected members, i.e. it will throw a compiler error
export declare class LisPaginatedSearchElementInterface<SearchData, SearchResult> {
  // public properties
  searchFunction: SearchFunction<SearchData, SearchResult>;
  submit(): void;
  // protected properties
  protected queryStringController: LisQueryStringParametersController;
  protected domContentLoadedController: LisDomContentLoadedController;
  protected cancelPromiseController: LisCancelPromiseController;
  protected requiredQueryStringParams: string[];
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

  /////////////////
  // controllers //
  /////////////////

  // a controller for interacting with URL query string parameters
  protected queryStringController = new LisQueryStringParametersController(this);

  // a controller for adding a DOM Content Loaded event listener
  protected domContentLoadedController = new LisDomContentLoadedController(this);

  // a controller that allows in-flight seaches to be cancelled
  protected cancelPromiseController = new LisCancelPromiseController(this);

  /////////////////
  // constructor //
  /////////////////

  constructor(...rest: any[]) {
    super(...rest);
    // submit the form after the DOM is finished loading
    this.domContentLoadedController.addListener(this._queryStringSubmit);
    // submit the form whenever the query string parameters change
    this.queryStringController.addListener(this._queryStringSubmit);
  }

  ////////////
  // styles //
  ////////////

  // disable shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  //////////////////////////
  // properties and state //
  //////////////////////////

  // the search callback function; not an attribute because functions can't be
  // parsed from attributes
  @property({type: Function, attribute: false})
  searchFunction: SearchFunction<SearchData, SearchResult> =
    () => Promise.reject(new Error('No search function provided'));

  // what form parts are required to submit a search
  @state()
  protected requiredQueryStringParams: string[] = [];

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

  // bind to the form wrapper element in the template
  @query('lis-form-wrapper-element')
  private _formWrapper!: LisFormWrapperElement;

  // what page should be used for the first search
  // TODO: is there a better way to handle the page in the query string search?
  private _searchPage = 1;

  ////////////////////
  // search methods //
  ////////////////////

  // allows the form in the paginated search element to be submitted programmatically
  submit(): void {
    // throw an error if the form wrapper is missing
    if (this._formWrapper === null) {
      throw new Error('No form wrapper in the template');
    }
    // submit the form via the form wrapper
    this._formWrapper.submit();
  }

  // submits the form if it was populated from querystring parameters
  private _queryStringSubmit(): void {
    // submit the form if every required query string is present
    const hasFields = this.requiredQueryStringParams.every((field) => {
        return Boolean(this.queryStringController.getParameter(field));
      });
    if (hasFields) {
      this._searchPage = Number(this.queryStringController.getParameter('page', '1'));
      this.submit();
    } else {
      this._resetComponent();
    }
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
      this.queryStringController.setParameters({page, ...this._data});
      this.cancelPromiseController.cancel();
      const options = {signal: this.cancelPromiseController.abortSignal};
      const searchPromise = this.searchFunction(this._data, page, options);
      this.cancelPromiseController.wrapPromise(searchPromise)
        .then(
          (results: PaginatedSearchResults<SearchResult>) => this._searchSuccess(results),
          (error: Error) => {
            // do nothing if the request was aborted
            if ((error as any).type !== 'abort') {
              this._searchFailure(error);
            }
          },
        );
    }
  }

  // updates the table and alert with the search result data
  private _searchSuccess(paginatedResults: PaginatedSearchResults<SearchResult>): void {
    // reset the initial page
    this._searchPage = 1;
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

  //////////////////////////
  // update state methods //
  //////////////////////////

  // converts the given FormData instance into an Object that will be passed to
  // the searchFunction
  // this is a default implementation and should be overridden in the concrete class
  // class if any ambiguity in the FormData needs to be resolved
  protected formToObject(formData: FormData): SearchData {
    return Object.fromEntries(formData) as unknown as SearchData;
  }

  // resets the component to its initial state
  private _resetComponent(): void {
    // update the search data
    this._data = undefined;
    // update the alert element
    this._setAlert('', 'primary');
    // update the table element
    this._table.data = [];
    // update the pagination element
    this._paginator.page = 1;
    this._paginator.hasNext = false;
  }

  // called when a search term is submitted
  private _updateData(e: CustomEvent): void {
    e.preventDefault();
    e.stopPropagation();  // we'll emit our own event
    this._data = this.formToObject(e.detail.data);
    this._paginator.page = this._searchPage;
    this._search();
  }

  // sets the alert element style and content
  private _setAlert(message: string, modifier: AlertModifier): void {
    this._alertMessage = message;
    this._alertModifier = modifier;
  }

  ////////////////////
  // render methods //
  ////////////////////

  // a method the concrete class must implement to render the form
  protected renderForm(): unknown {
    throw new Error('Method not implemented');
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

      <lis-pagination-element
        page=${this.queryStringController.getParameter('page', '1')}
        @pageChange=${this._changePage}>
      </lis-pagination-element>

    `;
  }

}

  return LisPaginatedSearchElement as
    unknown as  // TODO: get rid of this intermediate cast
    Constructor<LisPaginatedSearchElementInterface<SearchData, SearchResult>> & T;

};
