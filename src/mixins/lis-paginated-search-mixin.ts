import {LitElement, html} from 'lit';
import {query} from 'lit/decorators.js';
import {Ref} from 'lit/directives/ref.js';

import {
  LisCancelPromiseController,
  LisDomContentLoadedController,
  LisQueryStringParametersController,
} from '../controllers';
import {
  LisFormWrapperElement,
  LisLoadingElement,
  LisPaginationElement,
} from '../core';
import {
  //LisSearchElementInterface,
  LisSearchMixin,
  SearchFunction,
  SearchOptions,
  SearchResults,
} from './lis-search-mixin';
import {StringObjectModel} from '../models';

/**
 * The constructor used to type constrain the super class type of the
 * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin.
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
 * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin expects
 * back when it performs a search.
 *
 * @typeParam SearchResult - The type to expect in the results array of a
 * paginated search results object.
 */
export type PaginatedSearchResults<SearchResult> = {
  pageSize?: number;
  hasNext?: boolean;
  numResults?: number;
  numPages?: number;
} & SearchResults<SearchResult>;

/**
 * Used to require pagination information in generic types.
 */
export type PaginatedSearchData = {page: number};

/**
 * Optional parameters that may be given to a search function of a component
 * that uses the {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`}
 * mixin. The {@link !AbortSignal | `AbortSignal`} instance will emit if a search is
 * performed before the current search completes. This signal should be used to
 * cancel in-flight requests if the search API supports it.
 */
export type PaginatedSearchOptions = {} & SearchOptions;

/**
 * The signature of the search function required by components that use the
 * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin.
 *
 * @typeParam SearchData - The type of data that will be given to the search
 * function.
 * @typeParam SearchResult - The type that is expected to be in the results
 * array of the {@link PaginatedSearchResults | `PaginatedSearchResults`}
 * instance resolved by the {@link !Promise | `Promise`} returned by the search
 * function.
 *
 * @param searchData - The data that should be used to perform a search.
 * @param page - What page of the paginated results should be returned.
 * @param options - Optional parameters that aren't required to perform a search
 * but may be useful.
 */
export type PaginatedSearchFunction<
  SearchData extends PaginatedSearchData,
  SearchResult,
  SearchOptionsType extends PaginatedSearchOptions = PaginatedSearchOptions,
  SearchResultsType extends
    PaginatedSearchResults<SearchResult> = PaginatedSearchResults<SearchResult>,
> = SearchFunction<
  SearchData,
  SearchResult,
  SearchOptionsType,
  SearchResultsType
>;

/**
 * The interface of the class generated by the
 * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin.
 *
 * @typeParam SearchData - The type of data that will be given to
 * {@link LisPaginatedSearchElementInterface.searchFunction | `searchFunction`}.
 * @typeParam SearchResult - The type that is expected to be in the results
 * array of the {@link PaginatedSearchResults | `PaginatedSearchResults`}
 * instance resolved by the {@link !Promise | `Promise`} returned by the
 * {@link LisPaginatedSearchElementInterface.searchFunction | `searchFunction`}.
 */
// Actually used for type casting because TypeScript can't infer
// private/protected members, i.e. it will throw a compiler error
// TODO: can't use LisSearchElementInterface because it's not included in the compiled JS; fix this
//export declare class LisPaginatedSearchElementInterface<
//  SearchData extends PaginatedSearchData,
//  SearchResult,
//  SearchFunctionType = PaginatedSearchFunction<SearchData, SearchResult>,
//> extends LisSearchElementInterface<SearchData, SearchResult, SearchFunctionType> { }
export declare class LisPaginatedSearchElementInterface<
  SearchData extends PaginatedSearchData,
  SearchResult,
  SearchFunctionType extends PaginatedSearchFunction<
    SearchData,
    SearchResult
  > = PaginatedSearchFunction<SearchData, SearchResult>,
  SearchResultsType extends
    PaginatedSearchResults<SearchResult> = PaginatedSearchResults<SearchResult>,
> {
  /**
   * Components that use the
   * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin will
   * inherit this property. It stores an external function that must be provided
   * by users of the component that performs a search using the data from the
   * component's submitted search form.
   */
  searchFunction: SearchFunctionType;

  /**
   * Components that use the
   * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin must
   * define what attributes their search results will have so the mixin can
   * correctly parse and display the results in a table. These attributes
   * can be specified by setting this property in a component's constructor.
   * Additionally, this property may be used by the end user at run-time to override the
   * default result attributes defined by the component.
   */
  resultAttributes: string[];

  /**
   * Components that use the
   * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin must
   * define what attributes their search results will have so the mixin can
   * correctly parse and display the results in a table. The header of the
   * table is set from an object that has these attributes. The object can
   * be specified by setting this property in a component's constructor.  Additionally,
   * this property may be used by the end used at run-time to override the default table
   * headers defined by the component.
   */
  tableHeader: StringObjectModel;

  /**
   * Components that use the
   * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin can optionally
   * define CSS classes for the columns of the table results are displayed in a table.
   * The classes are set from an object that has attributes matching the
   * `resultAttributes`. The object can be specified by setting this property in a
   * component's constructor. Additionally, this property may be used by the end used at
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
   * Components that use the
   * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin will
   * inherit this method. It allows the component's search form to be submitted
   * programmatically.
   */
  submit(): void;

  /**
   * Components that use the
   * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin can use
   * this controller to interact with URL query string parameters. For example,
   * it can be used to set values of form elements reactively, i.e. if the
   * query string parameter a form element gets its value changes, then the
   * element's value will be updated in the component's template.
   */
  protected queryStringController: LisQueryStringParametersController;

  /**
   * Components that use the
   * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin can use
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
   * cancelled. Components that use the
   * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin can use
   * this controller to make {@link !Promise | `Promises`} cancelable. Event
   * listeners can also subscribe to the controller and will be called whenever
   * it cancels. The underlying {@link !AbortSignal | `AbortSignal`} is also
   * available for more low-level access. This is the value of the `abortSignal`
   * attribute of the {@link PaginatedSearchOptions | `PaginatedSearchOptions`}
   * object passed to the component's {@link SearchFunction | `SearchFunction`}.
   */
  protected cancelPromiseController: LisCancelPromiseController;

  /**
   * The {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin will
   * automatically perform a search when loaded if certain parameters are
   * present in the URL query string. Components that use the mixin can specify
   * what parameters are necessary by setting this property in their
   * constructor. Specifically, this property represents groups of parameters that will
   * trigger a search if all parameters within a group are present.
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
   * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin is
   * submitted, the mixin parses the form contents into a
   * {@link !FormData | `FormData`} instance. This instance is converted into
   * a simple object mapping form element names to their values. This conversion
   * is done with the `formToObject` method. If the object doesn't match the
   * expected `SearchData` template type or if there are redundant names in the
   * {@link !FormData | `FormData`} instance that need to be resolved, then the
   * component should override the `formToObject` method.
   *
   * @param formData - The {@link !FormData | `FormData`} instance to convert
   * into an object.
   *
   * @returns The object generated from the given {@link !FormData | `FormData`}
   * instance.
   */
  protected formToObject(formData: FormData): SearchData;

  /**
   * Components that use the
   * {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin need to
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
   * By default, the {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`}
   * displays search results info using the in paragraph tags. Components that use the
   * mixin can override this portion of the template by implementing their own
   * `renderResultsInfo` method.
   *
   * @returns The results info portion of the template.
   */
  protected renderResultsInfo(): unknown;

  /**
   * By default, the {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`}
   * displays search results using the
   * {@link LisSimpleTableElement | `LisSimpleTableElement`}. Components that use the
   * mixin can override this portion of the template by implementing their own
   * `renderResults` method. The results data will be available via the inherited
   * `searchResults` variable.
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
  protected _search(): void;

  /** @internal */
  protected _searchSuccess(searchResults: SearchResultsType): void;

  /** @internal */
  protected _resetComponent(): void;

  /** @internal */
  protected _updateData(e: CustomEvent): void;

  /** @internal */
  protected _getResultsInfo(searchResults: SearchResultsType): string;
}

/**
 * A mixin that encapsulates code that implements a paginated search. The mixin
 * is a function that uses the factory pattern to generate a class to be
 * extended by a component. To use the mixin, call the function with the
 * appropriate template arguments and extend the class it returns when defining
 * a component.
 *
 * @typeParam T - The class to use as the super class of the generated mixin
 * class. Should be an instance of the `LitElement` class or a descendant of it.
 * @typeParam SearchData - The type of data that will be given to
 * {@link LisPaginatedSearchElementInterface.searchFunction | `searchFunction`}.
 * @typeParam SearchResult - The type that is expected to be in the results
 * array of the {@link PaginatedSearchResults | `PaginatedSearchResults`}
 * instance resolved by the {@link !Promise | `Promise`} returned by the
 * {@link LisPaginatedSearchElementInterface.searchFunction | `searchFunction`}.
 *
 * @param superClass - The class to use as the super class of the generated
 * mixin class. Should be an instance of the `LitElement` class or a descendant
 * of it.
 *
 * @returns The generated mixin class.
 *
 * @example
 * When using the mixin, the
 * {@link LisPaginatedSearchElementInterface.requiredQueryStringParams | `requiredQueryStringParams`},
 y {@link LisPaginatedSearchElementInterface.resultAttributes | `resultAttributes`},
 * and {@link LisPaginatedSearchElementInterface.tableHeader | `tableHeader`}
 * properties of the extended class must be set in the component's constructor.
 *
 * The {@link LisPaginatedSearchElementInterface.renderForm | `renderForm`}
 * method must be overridden to define the form part of the component's
 * template. It is recommended that the form's elements' values are bound to the
 * URL query string parameters using the inherited
 * {@link LisPaginatedSearchElementInterface.queryStringController | `queryStringController`}
 * since their values will automatically be reflected in the URL query string
 * parameters.
 *
 * Lastly, note the due to TypeScript's lack of support for partial type
 * argument inference the mixin function is curried. This means the function
 * returns another function that must also be called to generate the mixin
 * class:
 * ```js
 * @customElement('lis-gene-search-element')
 * export class LisGeneSearchElement extends
 * LisPaginatedSearchMixin(LitElement)<GeneSearchData, GeneSearchResult>()  // <-- curried function call
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
 *           <legend class="uk-legend">Gene search</legend>
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
 * By default, the {@link LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} renders
 * search results using the {@link LisSimpleTableElement | `LisSimpleTableElement`}.
 * If this is too restrictive, a class that uses the mixin may override its
 * `renderResults` method to draw the results portion of the template itself.
 * For example:
 * ```js
 * @customElement('lis-gene-search-element')
 * export class LisGeneSearchElement extends
 * LisPaginatedSearchMixin(LitElement)<GeneSearchData, GeneSearchResult>()  // <-- curried function call
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
 *         caption="Search Results"
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
export const LisPaginatedSearchMixin =
  <T extends Constructor<LitElement>>(superClass: T) =>
  <
    SearchData extends PaginatedSearchData,
    SearchResult,
    SearchFunctionType extends PaginatedSearchFunction<
      SearchData,
      SearchResult
    > = PaginatedSearchFunction<SearchData, SearchResult>,
    SearchResultsType extends
      PaginatedSearchResults<SearchResult> = PaginatedSearchResults<SearchResult>,
  >() => {
    const SuperClassSearchMixin = LisSearchMixin(superClass)<
      SearchData,
      SearchResult,
      SearchFunctionType,
      SearchResultsType
    >();

    // the mixin class
    class LisPaginatedSearchElement extends SuperClassSearchMixin {
      //////////////////////////
      // properties and state //
      //////////////////////////

      // bind to the pagination element in the template
      @query('lis-pagination-element')
      private _paginator!: LisPaginationElement;

      // what page should be used for the first search
      // TODO: is there a better way to handle the page in the query string search?
      private _searchPage = 1;

      ////////////////////
      // search methods //
      ////////////////////

      // submits the form if it was populated from querystring parameters
      protected override _queryStringSubmit(): void {
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
          this._searchPage = Number(
            this.queryStringController.getParameter('page', '1'),
          );
          this.submit();
        } else {
          this._resetComponent();
        }
      }

      // called when the page changes
      private _changePage(e: CustomEvent): void {
        e.preventDefault();
        e.stopPropagation(); // we'll emit our own event
        this._search();
      }

      // performs a search via an external function
      protected override _search(): void {
        if (this._searchData !== undefined) {
          const page = this._paginator.page;
          this._loadingRef.value?.loading();
          const searchData = {...this._searchData, page};
          this.queryStringController.setParameters(searchData);
          this.cancelPromiseController.cancel();
          const options = {
            abortSignal: this.cancelPromiseController.abortSignal,
          };
          const searchPromise = this.searchFunction(searchData, options);
          this.cancelPromiseController.wrapPromise(searchPromise).then(
            (results: PaginatedSearchResults<SearchResult>) =>
              this._searchSuccess(results),
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
      protected override _searchSuccess(
        paginatedResults: PaginatedSearchResults<SearchResult>,
      ): void {
        // reset the initial page
        this._searchPage = 1;
        // perform the default search success
        super._searchSuccess(paginatedResults);
        // destruct the paginated search result
        const {hasNext, numPages} = {
          // provide a default value for hasNext based on if there's any results
          hasNext: Boolean(paginatedResults.results.length),
          ...paginatedResults,
        };
        // update the pagination element
        this._paginator.hasNext = hasNext;
        this._paginator.numPages = numPages;
      }

      //////////////////////////
      // update state methods //
      //////////////////////////

      // resets the component to its initial state
      protected override _resetComponent(): void {
        super._resetComponent();
        // update the pagination element
        this._paginator.page = 1;
        this._paginator.numPages = undefined;
        this._paginator.hasNext = false;
      }

      // called when a search term is submitted
      protected override _updateData(e: CustomEvent): void {
        this._paginator.page = this._searchPage;
        super._updateData(e);
      }

      // returns a string describing the results found by the search
      protected override _getResultsInfo(
        paginatedResults: SearchResultsType,
      ): string {
        // destruct the paginated search result
        const {pageSize, numResults: totalResults, results} = paginatedResults;
        const numResults = results.length;
        const page = this._paginator.page;
        // report the results range the page covers
        const counts: string[] = [];
        if (numResults > 0 && pageSize != undefined) {
          const start = (page - 1) * pageSize + 1;
          const end = start + numResults - 1;
          const resultRange = `${start.toLocaleString()}-${end.toLocaleString()}`;
          counts.push(resultRange);
        }
        // report the number of results total
        if (totalResults !== undefined) {
          if (counts.length > 0) {
            counts.push('of');
          }
          const plural = totalResults == 1 ? '' : 's';
          const resultsCount = `${totalResults.toLocaleString()} result${plural}`;
          counts.push(resultsCount);
        }
        return counts.join(' ');
      }

      ////////////////////
      // render methods //
      ////////////////////

      override render(): unknown {
        const searchHtml = super.render();

        // the template
        return html`
          ${searchHtml}

          <lis-pagination-element
            .scrollTarget=${this._formRef.value}
            page=${this.queryStringController.getParameter('page', '1')}
            @pageChange=${this._changePage}
          >
          </lis-pagination-element>
        `;
      }
    }

    return LisPaginatedSearchElement as unknown as Constructor<
      // TODO: get rid of this intermediate cast
      LisPaginatedSearchElementInterface<SearchData, SearchResult>
    > &
      T;
  };
