import {LitElement, html} from 'lit';
import {property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {
  LisCancelPromiseController,
  LisDomContentLoadedController,
  LisQueryStringParametersController,
} from '../controllers';
import {LisFormWrapperElement, LisLoadingElement} from '../core';
import {StringObjectModel} from '../models';

/**
 * The constructor used to type constrain the super class type of the
 * {@link LisSearchMixin | `LisSearchMixin`} mixin.
 *
 * @typeParam T - The type of class to be instantiated.
 * @typeParam Params - The type of the parameters argument for T.
 *
 * @param args - The arguments that will be passed to the super class
 * constructor.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = {}, Params extends any[] = any[]> = new (
  ...args: Params
) => T;

/**
 * The type of object a component that uses the
 * {@link LisSearchMixin | `LisSearchMixin`} mixin expects
 * back when it performs a search.
 *
 * @typeParam SearchResult - The type to expect in the results array of a
 * search results object.
 */
export type SearchResults<SearchResult> = {
  errors?: string[];
  results: SearchResult[];
};

/**
 * Optional parameters that may be given to a search function of a component
 * that uses the {@link LisSearchMixin | `LisSearchMixin`} mixin. The
 * {@link !AbortSignal | `AbortSignal`} instance will emit if a search is
 * performed before the current search completes. This signal should be used to
 * cancel in-flight requests if the search API supports it.
 */
export type SearchOptions = {abortSignal?: AbortSignal};

/**
 * The signature of the search function required by components that use the
 * {@link LisSearchMixin | `LisSearchMixin`} mixin.
 *
 * @typeParam SearchData - The type of data that will be given to the search
 * function.
 * @typeParam SearchResult - The type that is expected to be in the results
 * array of the {@link SearchResults | `SearchResults`} instance resolved by
 * the {@link !Promise | `Promise`} returned by the search function.
 *
 * @param searchData - The data that should be used to perform a search.
 * @param options - Optional parameters that aren't required to perform a search
 * but may be useful.
 */
export type SearchFunction<
  SearchData,
  SearchResult,
  SearchOptionsType extends SearchOptions = SearchOptions,
  SearchResultsType extends
    SearchResults<SearchResult> = SearchResults<SearchResult>,
> = (
  searchData: SearchData,
  options: SearchOptionsType,
) => Promise<SearchResultsType>;

/**
 * The type of object a component that uses the
 * {@link LisSearchMixin | `LisSearchMixin`} mixin expects
 * back when it performs a download.
 */
export type DownloadResults = {
  errors?: string[];
};

/**
 * The signature of the optional download function available in components that use the
 * {@link LisSearchMixin | `LisSearchMixin`} mixin.
 *
 * @typeParam SearchData - The type of data that will be given to the search
 * function.
 *
 * @param searchData - The data that should be used to perform a search.
 * @param options - Optional parameters that aren't required to perform a search
 * but may be useful.
 */
export type DownloadFunction<
  SearchData,
  SearchOptionsType extends SearchOptions = SearchOptions,
> = (
  searchData: SearchData,
  options: SearchOptionsType,
) => Promise<DownloadResults>;

/**
 * The interface of the class generated by the
 * {@link LisSearchMixin | `LisSearchMixin`} mixin.
 *
 * @typeParam SearchData - The type of data that will be given to
 * {@link LisSearchElementInterface.searchFunction | `searchFunction`} and
 * {@link LisSearchElementInterface.downloadFunction | `downloadFunction`}.
 * @typeParam SearchResult - The type that is expected to be in the results
 * array of the {@link SearchResults | `SearchResults`} instance resolved by
 * the {@link !Promise | `Promise`} returned by the
 * {@link LisSearchElementInterface.searchFunction | `searchFunction`}.
 */
// Actually used for type casting because TypeScript can't infer
// private/protected members, i.e. it will throw a compiler error
export declare class LisSearchElementInterface<
  SearchData,
  SearchResult,
  SearchFunctionType extends SearchFunction<
    SearchData,
    SearchResult
  > = SearchFunction<SearchData, SearchResult>,
  SearchResultsType extends
    SearchResults<SearchResult> = SearchResults<SearchResult>,
  DownloadFunctionType extends
    DownloadFunction<SearchData> = DownloadFunction<SearchData>,
> {
  /**
   * Components that use the {@link LisSearchMixin | `LisSearchMixin`} mixin will
   * inherit this property. It stores an external function that must be provided
   * by users of the component that performs a search using the data from the
   * component's submitted search form.
   */
  searchFunction: SearchFunctionType;

  /**
   * Components that use the {@link LisSearchMixin | `LisSearchMixin`} mixin will
   * inherit this property. It stores an external function that can optionally be provided
   * by users of the component that loads a file to download using the data from the
   * component's submitted search form.
   */
  downloadFunction?: DownloadFunctionType;

  /**
   * Components that use the {@link LisSearchMixin | `LisSearchMixin`} mixin must
   * define what attributes their search results will have so the mixin can
   * correctly parse and display the results in a table. These attributes
   * can be specified by setting this property in a component's constructor.
   * Additionally, this property may be used by the end user at run-time to override the
   * default result attributes defined by the component.
   */
  resultAttributes: string[];

  /**
   * Components that use the {@link LisSearchMixin | `LisSearchMixin`} mixin must
   * define what attributes their search results will have so the mixin can
   * correctly parse and display the results in a table. The header of the
   * table is set from an object that has these attributes. The object can
   * be specified by setting this property in a component's constructor.  Additionally,
   * this property may be used by the end user at run-time to override the default table
   * headers defined by the component.
   */
  tableHeader: StringObjectModel;

  /**
   * Components that use the {@link LisSearchMixin | `LisSearchMixin`} mixin can optionally
   * define CSS classes for the columns of the table results are displayed in.
   * The classes are set from an object that has attributes matching the
   * `resultAttributes`. The object can be specified by setting this property in a
   * component's constructor. Additionally, this property may be used by the end user at
   * run-time to override the default table column classes defined by the component.
   */
  tableColumnClasses: StringObjectModel;

  /**
   * A helper method that returns that first value that's defined: the given value, the value of the
   * specified querystring parameter, an empty string.
   *
   * @param value - The value to potentially return.
   * @param parameter - The querystring parameter to potentially return the value of.
   *
   * @returns The first value that was defined.
   */
  protected valueOrQuerystringParameter(
    value: string | undefined,
    parameter: string,
  ): string;

  /**
   * Components that use the {@link LisSearchMixin | `LisSearchMixin`} mixin will
   * inherit this method. It allows the component's search form to be submitted
   * programmatically.
   */
  submit(): void;

  /**
   * Components that use the {@link LisSearchMixin | `LisSearchMixin`} mixin can use
   * this controller to interact with URL query string parameters. For example,
   * it can be used to set values of form elements reactively, i.e. if the
   * query string parameter a form element gets its value changes, then the
   * element's value will be updated in the component's template.
   */
  protected queryStringController: LisQueryStringParametersController;

  /**
   * Components that use the {@link LisSearchMixin | `LisSearchMixin`} mixin can use
   * this controller to subscribe to the
   * {@link !DOMContentLoaded | `DOMContentLoaded`} event. The advantage to
   * using the controller instead of subscribing to the event directly is that
   * the controller triggers a redraw of the component's template, meaning if a
   * listener updates a property that should change the template, triggering a
   * redraw of the template will be handled by the controller.
   */
  protected domContentLoadedController: LisDomContentLoadedController;

  /**
   * Current Web standards do not allow {@link !Promise | `Promises`} to be
   * cancelled. Components that use the {@link LisSearchMixin | `LisSearchMixin`}
   * mixin can use this controller to make {@link !Promise | `Promises`}
   * cancelable. Event listeners can also subscribe to the controller and will be
   * called whenever it cancels. The underlying
   * {@link !AbortSignal | `AbortSignal`} is also available for more low-level
   * access. This is the value of the `abortSignal` attribute of the
   * {@link SearchOptions | `SearchOptions`} object passed to the component's
   * {@link SearchFunction | `SearchFunction`} and
   * {@link DownloadFunction | `DownloadFunction`}.
   */
  protected cancelPromiseController: LisCancelPromiseController;

  /**
   * The {@link LisSearchMixin | `LisSearchMixin`} mixin will automatically
   * perform a search when loaded if certain parameters are present in the URL
   * query string. Components that use the mixin can specify what parameters are
   * necessary by setting this property in their constructor. Specifically, this
   * property represents groups of parameters that will trigger a search if all
   * parameters within a group are present.
   */
  protected requiredQueryStringParams: string[][];

  /**
   * The results returned by the `searchFunction`.
   */
  protected searchResults: SearchResult[];

  /**
   * Info about the results returned by the `searchFunction`.
   */
  protected resultsInfo: string;

  /**
   * When the form of a component that use the
   * {@link LisSearchMixin | `LisSearchMixin`} mixin is submitted, the mixin
   * parses the form contents into a {@link !FormData | `FormData`} instance.
   * This instance is converted into a simple object mapping form element names
   * to their values. This conversion is done with the `formToObject` method. If
   * the object doesn't match the expected `SearchData` template type or if there
   * are redundant names in the {@link !FormData | `FormData`} instance that need
   * to be resolved, then the component should override the `formToObject` method.
   *
   * @param formData - The {@link !FormData | `FormData`} instance to convert
   * into an object.
   *
   * @returns The object generated from the given {@link !FormData | `FormData`}
   * instance.
   */
  protected formToObject(formData: FormData): SearchData;

  /**
   * Components that use the {@link LisSearchMixin | `LisSearchMixin`} mixin need to
   * provide the search form that the mixin will process. This is done by
   * overriding the `renderForm` method.
   *
   * @throws {@link !Error | `Error`}
   * This exception is thrown if the `renderForm` method is not overridden when
   * called.
   *
   * @returns The form portion of the template.
   */
  protected renderForm(): unknown;

  /**
   * By default, the {@link LisSearchMixin | `LisSearchMixin`} displays search
   * results info using the in paragraph tags. Components that use the mixin can
   * override this portion of the template by implementing their own
   * `renderResultsInfo` method.
   *
   * @returns The results info portion of the template.
   */
  protected renderResultsInfo(): unknown;

  /**
   * By default, the {@link LisSearchMixin | `LisSearchMixin`} displays search
   * results using the {@link LisSimpleTableElement | `LisSimpleTableElement`}.
   * Components that use the mixin can override this portion of the template by
   * implementing their own `renderResults` method. The results data will be
   * available via the inherited `searchResults` variable.
   *
   * @returns The results portion of the template.
   */
  protected renderResults(): unknown;

  /** these properties should only be used by mixins and not overridden */

  /** @internal */
  protected _searchData: SearchData | undefined;

  /** @internal */
  protected _formRef: Ref<LisFormWrapperElement>;

  /** @internal */
  protected _loadingRef: Ref<LisLoadingElement>;

  /** these methods should only be used/overridden by mixins */

  /** @internal */
  protected _queryStringSubmit(): void;

  /** @internal */
  protected _search(searchData: SearchData | undefined): void;

  /** @internal */
  protected _searchSuccess(searchResults: SearchResultsType): void;

  /** @internal */
  protected _download(formData: SearchData): void;

  /** @internal */
  protected _downloadSuccess(downloadResults: DownloadResults): void;

  /** @internal */
  protected _resetComponent(): void;

  /** @internal */
  protected _formSubmitted(e: CustomEvent): void;

  /** @internal */
  protected _getResultsInfo(searchResults: SearchResultsType): string;
}

/**
 * A mixin that encapsulates code that implements a search component. The mixin
 * is a function that uses the factory pattern to generate a class to be
 * extended by a component. To use the mixin, call the function with the
 * appropriate template arguments and extend the class it returns when defining
 * a component.
 *
 * @typeParam T - The class to use as the super class of the generated mixin
 * class. Should be an instance of the `LitElement` class or a descendant of it.
 * @typeParam SearchData - The type of data that will be given to
 * {@link LisSearchElementInterface.searchFunction | `searchFunction`} and
 * {@link LisSearchElementInterface.downloadFunction | `downloadFunction`}.
 * @typeParam SearchResult - The type that is expected to be in the results
 * array of the {@link SearchResults | `SearchResults`} instance resolved by the
 * {@link !Promise | `Promise`} returned by the
 * {@link LisSearchElementInterface.searchFunction | `searchFunction`}.
 *
 * @param superClass - The class to use as the super class of the generated
 * mixin class. Should be an instance of the `LitElement` class or a descendant
 * of it.
 *
 * @returns The generated mixin class.
 *
 * @example
 * When using the mixin, the
 * {@link LisSearchElementInterface.requiredQueryStringParams | `requiredQueryStringParams`},
 y {@link LisSearchElementInterface.resultAttributes | `resultAttributes`},
 * and {@link LisSearchElementInterface.tableHeader | `tableHeader`}
 * properties of the extended class must be set in the component's constructor.
 *
 * The {@link LisSearchElementInterface.renderForm | `renderForm`}
 * method must be overridden to define the form part of the component's
 * template. It is recommended that the form's elements' values are bound to the
 * URL query string parameters using the inherited
 * {@link LisSearchElementInterface.queryStringController | `queryStringController`}
 * since their values will automatically be reflected in the URL query string
 * parameters.
 *
 * Lastly, note the due to TypeScript's lack of support for partial type
 * argument inference the mixin function is curried. This means the function
 * returns another function that must also be called to generate the mixin
 * class:
 * ```js
 * @customElement('lis-pangene-lookup-element')
 * export class LisPangeneLookupElement extends
 * LisSearchMixin(LitElement)<PangeneSearchData, PangeneSearchResult>()  // <-- curried function call
 * {
 *
 *   // set properties in the constructor
 *   constructor() {
 *     super();
 *     // configure query string parameters
 *     this.requiredQueryStringParams = [['query']];
 *     // configure results table
 *     this.resultAttributes = ['name', 'description'];
 *     this.tableHeader = {name: 'Name', description: 'Description'};
 *   }
 *
 *   // define the form part of the template
 *   override renderForm() {
 *     // NOTE:
 *     // 1) the input element has a name attribute, which all form elemnts are required to have
 *     // 2) the input value is set to a URL query string parameter value
 *     return html`
 *       <form>
 *         <fieldset class="uk-fieldset">
 *           <legend class="uk-legend">Pangene lookup</legend>
 *           <div class="uk-margin">
 *             <input
 *               name="query"  // <-- all form elements need a name
 *               class="uk-input"
 *               type="text"
 *               placeholder="Input"
 *               aria-label="Input"
 *               .value=${this.queryStringController.getParameter('query')}>
 *           </div>
 *           <div class="uk-margin">
 *             <button type="submit" class="uk-button uk-button-primary">Search</button>
 *           </div>
 *         </fieldset>
 *       </form>
 *     `;
 *   }
 *
 * }
 * ```
 *
 * @example
 * By default, the {@link LisSearchMixin | `LisSearchMixin`} renders
 * search results using the {@link LisSimpleTableElement | `LisSimpleTableElement`}.
 * If this is too restrictive, a class that uses the mixin may override its
 * `renderResults` method to draw the results portion of the template itself.
 * For example:
 * ```js
 * @customElement('lis-pangene-lookup-element')
 * export class LisPangeneLookupElement extends
 * LisSearchMixin(LitElement)<PangeneSearchData, PangeneSearchResult>()  // <-- curried function call
 * {
 *
 *   // set properties in the constructor
 *   constructor() {
 *     super();
 *     // configure query string parameters
 *     this.requiredQueryStringParams = [['query']];
 *     // no need to configure the results table since we're going to override it
 *   }
 *
 *   // define the form part of the template
 *   override renderForm() {
 *     ...
 *   }
 *
 *   // define the results part of the template
 *   override renderResults() {
 *     // this is actually the default implementation provided by the mixin
 *     return html`
 *       <lis-simple-table-element
 *         caption="Lookup Results"
 *         .dataAttributes=${this.resultAttributes}
 *         .header=${this.tableHeader}
 *         .data=${this.searchResults}>
 *       </lis-simple-table-element>
 *     `;
 *   }
 *
 * }
 * ```
 */
// HACK: curried function because TypeScript doesn't support partial type
// argument inference: https://github.com/microsoft/TypeScript/issues/26242
export const LisSearchMixin =
  <T extends Constructor<LitElement>>(superClass: T) =>
  <
    SearchData,
    SearchResult,
    SearchFunctionType extends SearchFunction<
      SearchData,
      SearchResult
    > = SearchFunction<SearchData, SearchResult>,
    SearchResultsType extends
      SearchResults<SearchResult> = SearchResults<SearchResult>,
    DownloadFunctionType extends
      DownloadFunction<SearchData> = DownloadFunction<SearchData>,
  >() => {
    // the mixin class
    class LisSearchElement extends superClass {
      /////////////////
      // controllers //
      /////////////////

      // a controller for interacting with URL query string parameters
      protected queryStringController = new LisQueryStringParametersController(
        this,
      );

      // a controller for adding a DOM Content Loaded event listener
      protected domContentLoadedController = new LisDomContentLoadedController(
        this,
      );

      // a controller that allows in-flight seaches to be cancelled
      protected cancelPromiseController = new LisCancelPromiseController(this);

      /////////////////
      // constructor //
      /////////////////

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // @ts-expect-error function is incompatible with the type
      searchFunction: SearchFunctionType = () =>
        Promise.reject(new Error('No search function provided'));

      // the download callback function; not an attribute because functions can't be
      // parsed from attributes
      @property({type: Function, attribute: false})
      downloadFunction?: DownloadFunctionType;

      // attributes of result objects in the concrete class
      @property()
      resultAttributes: string[] = [];

      // the table headers to use in the concrete class
      @property()
      tableHeader: StringObjectModel = {};

      // the table column classes to use in the concrete class
      @property()
      tableColumnClasses: StringObjectModel = {};

      // what form parts are required to submit a search
      @state()
      protected requiredQueryStringParams: string[][] = [];

      // keep a copy of the search results for template generalization
      @state()
      protected searchResults: SearchResult[] = [];

      // info about the search results
      @state()
      protected resultsInfo: string = '';

      // keep a copy of the search form data for querystring parameters
      @state()
      protected _searchData: SearchData | undefined = undefined;

      // bind to the form (wrapper) element in the template
      protected _formRef: Ref<LisFormWrapperElement> = createRef();

      // bind to the loading element in the template
      protected _loadingRef: Ref<LisLoadingElement> = createRef();

      ////////////////////
      // helper methods //
      ////////////////////

      protected valueOrQuerystringParameter(
        value: string | undefined,
        parameter: string,
      ): string {
        if (value === undefined) {
          return this.queryStringController.getParameter(parameter);
        }
        return value;
      }

      ////////////////////
      // search methods //
      ////////////////////

      // allows the form in the search element to be submitted programmatically
      submit(): void {
        // throw an error if the form wrapper is missing
        if (this._formRef.value === undefined) {
          throw new Error('No form wrapper in the template');
        }
        // submit the form via the form wrapper
        this._formRef.value?.submit();
      }

      // submits the form if it was populated from querystring parameters
      protected _queryStringSubmit(): void {
        // submit the form if one or more groups of parameters are present
        const hasFields = this.requiredQueryStringParams.some((group) => {
          // check that every parameter in the group is in the querystring
          return (
            group.length &&
            group.every((field) => {
              return Boolean(this.queryStringController.getParameter(field));
            })
          );
        });
        if (hasFields && this.requiredQueryStringParams.length) {
          this.submit();
        } else {
          this._resetComponent();
        }
      }

      // performs a search via an external function
      protected _search(searchData: SearchData | undefined): void {
        if (searchData === undefined) {
          return;
        }
        this._loadingRef.value?.loading();
        this.queryStringController.setParameters({
          ...searchData,
        } as Object);
        this.cancelPromiseController.cancel();
        const options = {
          abortSignal: this.cancelPromiseController.abortSignal,
        };
        // NOTE: an explicit cast is done here because the type inference is wrong
        const searchPromise = this.searchFunction(
          searchData,
          options,
        ) as Promise<SearchResultsType>;
        this.cancelPromiseController.wrapPromise(searchPromise).then(
          (results: SearchResultsType) => this._searchSuccess(results),
          (error: Error | Event) => {
            // do nothing if the request was aborted
            if (!(error instanceof Event && error.type === 'abort')) {
              this._loadingRef.value?.failure();
              throw error;
            }
          },
        );
      }

      // performs a search via an external function
      protected _download(formData: SearchData): void {
        if (this.downloadFunction !== undefined) {
          this._loadingRef.value?.loading();
          this.cancelPromiseController.cancel();
          const options = {
            abortSignal: this.cancelPromiseController.abortSignal,
          };
          // NOTE: an explicit cast is done here because the type inference is wrong
          const downloadPromise = this.downloadFunction(formData, options);
          this.cancelPromiseController.wrapPromise(downloadPromise).then(
            (results: DownloadResults) => this._downloadSuccess(results),
            (error: Error | Event) => {
              // do nothing if the request was aborted
              if (!(error instanceof Event && error.type === 'abort')) {
                this._loadingRef.value?.failure();
                throw error;
              }
            },
          );
        }
      }

      // updates the table and loading element with the search result data
      protected _searchSuccess(searchResults: SearchResultsType): void {
        const {results, errors} = searchResults;
        // update the loading element accordingly
        if (errors && errors.length) {
          const message = errors.join('<br/>');
          this._loadingRef.value?.error(message);
        } else if (results.length) {
          this._loadingRef.value?.success();
        } else {
          this._loadingRef.value?.noResults();
        }
        // display the results in the table
        this.resultsInfo = this._getResultsInfo(searchResults);
        this.searchResults = results;
      }

      // updates the table and loading element with the search result data
      protected _downloadSuccess(downloadResults: DownloadResults): void {
        const {errors} = downloadResults;
        // update the loading element accordingly
        if (errors && errors.length) {
          const message = errors.join('<br/>');
          this._loadingRef.value?.error(message);
        } else {
          this._loadingRef.value?.success();
        }
        this.resultsInfo = 'Download successful';
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
      protected _resetComponent(): void {
        // update the search data
        this._searchData = undefined;
        // update the loading element
        this._loadingRef.value?.success();
        // update the results
        this.resultsInfo = '';
        this.searchResults = [];
      }

      // called when a search term is submitted
      protected _formSubmitted(e: CustomEvent): void {
        e.preventDefault();
        e.stopPropagation(); // we'll emit our own event
        const formData = this.formToObject(e.detail.data);
        if (
          // @ts-expect-error explicitOriginalTarget properties
          e.explicitOriginalTarget.value === 'download' &&
          this.downloadFunction !== undefined
        ) {
          this._download(formData);
        } else {
          this._searchData = formData;
          this._search(formData);
        }
      }

      // returns a string describing the results found by the search
      protected _getResultsInfo(searchResults: SearchResultsType): string {
        const {results} = searchResults;
        const numResults = results.length;
        const plural = numResults == 1 ? '' : 's';
        return `${numResults.toLocaleString()} result${plural}`;
      }

      ////////////////////
      // render methods //
      ////////////////////

      // a method the concrete class must implement to render the form
      protected renderForm(): unknown {
        throw new Error('Method not implemented');
      }

      // a method that provides a default template for displaying results info that can be
      // overridden by the concrete class
      protected renderResultsInfo(): unknown {
        if (this.resultsInfo) {
          return html`<p>${this.resultsInfo}</p>`;
        }
        return html``;
      }

      // a method that provides a default template for displaying results that can be
      // overridden by the concrete class
      protected renderResults(): unknown {
        return html`
          <lis-simple-table-element
            .dataAttributes=${this.resultAttributes}
            .header=${this.tableHeader}
            .columnClasses=${this.tableColumnClasses}
            .data=${this.searchResults}
          >
          </lis-simple-table-element>
        `;
      }

      override render(): unknown {
        // render the template parts
        const form = this.renderForm();
        const resultsInfo = this.renderResultsInfo();
        const results = this.renderResults();

        // the template
        return html`
          <lis-form-wrapper-element
            ${ref(this._formRef)}
            @submit="${this._formSubmitted}"
          >
            ${form}
          </lis-form-wrapper-element>

          ${resultsInfo}

          <div class="uk-inline uk-width-1-1 uk-overflow-auto uk-text-small">
            <lis-loading-element ${ref(this._loadingRef)}></lis-loading-element>
            ${results}
          </div>
        `;
      }
    }

    return LisSearchElement as unknown as Constructor<
      // TODO: get rid of this intermediate cast
      LisSearchElementInterface<SearchData, SearchResult>
    > &
      T;
  };
