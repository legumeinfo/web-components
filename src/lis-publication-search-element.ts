import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

import {LisPaginatedSearchMixin, PaginatedSearchOptions} from './mixins';

/**
 * The data that will be passed to the search function by the
 * {@link LisPublicationSearchElement | `LisPublicationSearchElement`} class when a search is
 * performed.
 */
export type PublicationSearchData = {
  page: number;
  query: string;
};

/**
 * A single result of a Publication search performed by the
 * {@link LisPublicationSearchElement | `LisPublicationSearchElement`} class.
 */
export type PublicationSearchResult = {
  year: number;
  title: string;
  journal: string;
  firstAuthor: string;
  doi: string;
  pubMedId: string;
};

/**
 * The signature of the function the
 * {@link LisPublicationSearchElement | `LisPublicationSearchElement`} class requires for
 * performing a Publication search.
 *
 * @param query The search term in the input element when the search form was
 * submitted.
 * new search is performed.
 * @param options Optional parameters that aren't required to perform a Publication
 * search but may be useful.
 *
 * @returns A {@link !Promise | `Promise`} that resolves to an
 * {@link !Array | `Array`} of {@link PublicationSearchResult | `PublicationSearchResult`}
 * objects.
 */
export type PublicationSearchFunction = (
  searchData: PublicationSearchData,
  options: PaginatedSearchOptions,
) => Promise<Array<PublicationSearchResult>>;

/**
 * @htmlElement `<lis-publication-search-element>`
 *
 * A Web Component that provides an interface for performing keyword searches
 * for Publications and displaying results in a paginated table. Note that the
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
 * must be set on a `<lis-publication-search-element>` tag's instance of the
 * {@link LisPublicationSearchElement | `LisPublicationSearchElement`} class. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-publication-search-element id="publication-search"></lis-publication-search-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // a site-specific function that sends a request to a Publication search API
 *   function getPublications(searchData, {abortSignal}) {
 *     // returns a Promise that resolves to a search result object
 *   }
 *   // get the Publication search element
 *   const searchElement = document.getElementById('publication-search');
 *   // set the element's searchFunction property
 *   searchElement.searchFunction = getPublications;
 * </script>
 * ```
 *
 * @example
 * The {@link LisPublicationSearchElement | `LisPublicationSearchElement`} class inherits the
 * {@link resultAttributes | `resultAttributes`} and
 * {@link tableHeader | `tableHeader`} properties from
 * {@link mixins!LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin. These are
 * used to define what attributes of the results provided by the
 * {@link searchFunction | `searchFunction`} will be shown in the results table and
 * what their corresponding headers will be in the table. These properties can be
 * overridden via JavaScript. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-publication-search-element id="publication-search"></lis-publication-search-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // get the publication search element
 *   const searchElement = document.getElementById('publication-search');
 *   // set the element's resultAttributes property
 *   searchElement.resultAttributes = ["title", "firstAuthor", "doi"];
 *   // set the element's tableHeader property
 *   searchElement.tableHeader = {
 *     title: "Title",
 *     firstAuthor: "First Author",
 *     doi: "DOI",
 *   };
 * </script>
 * ```
 *
 * @example
 * The {@link titleExample | `titleExample`} property can be used to set the
 * example text in the search form. For example:
 * ```html
 * <!-- set the example text via HTML -->
 * <lis-publication-search-element titleExample="expression"></lis-publication-search-element>
 *
 * <!-- set the example text via JavaScript -->
 * <lis-publication-search-element id="publication-search"></lis-publication-search-element>
 *
 * <script type="text/javascript">
 *   // get the publication search element
 *   const searchElement = document.getElementById('publication-search');
 *   // set the element's titleExample property
 *   searchElement.titleExample = 'expression';
 * </script>
 * ```
 */
@customElement('lis-publication-search-element')
export class LisPublicationSearchElement extends LisPaginatedSearchMixin(
  LitElement,
)<PublicationSearchData, PublicationSearchResult>() {
  /** @ignore */
  // used by Lit to style the Shadow DOM
  // not necessary but exclusion breaks TypeDoc
  static override styles = css``;

  /**
   * An optional property to set the example text for the search field.
   *
   * @attribute
   */
  @property({type: String})
  titleExample?: string;

  constructor() {
    super();
    // configure query string parameters
    this.requiredQueryStringParams = [['query']];
    // configure results table
    this.resultAttributes = [
      'year',
      'title',
      'journal',
      'firstAuthor',
      'doi',
      'pubMedId',
    ];
    this.tableHeader = {
      year: 'Year',
      title: 'Title',
      journal: 'Journal',
      firstAuthor: 'First Author',
      doi: 'DOI',
      pubMedId: 'PubMed',
    };
  }

  /** @ignore */
  // used by LisPaginatedSearchMixin to draw the template
  override renderForm() {
    return html`
      <form>
        <fieldset class="uk-fieldset">
          <legend class="uk-legend">Publication title search</legend>
          <div class="uk-margin">
            <input
              name="query"
              class="uk-input"
              type="text"
              aria-label="Input"
              .value=${this.queryStringController.getParameter('query')}
            />
            <lis-form-input-example-element
              .text=${this.titleExample}
            ></lis-form-input-example-element>
          </div>
          <div class="uk-margin">
            <button type="submit" class="uk-button uk-button-primary">
              Search
            </button>
          </div>
        </fieldset>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-publication-search-element': LisPublicationSearchElement;
  }
}
