# Create a web component #
Before creating a new web component, be sure that the supporting GraphQL query exists and works as you expect.
See [graphql-server](https://github.com/legumeinfo/graphql-server) for more information.

For this example, we'll create a web component that performs a search for a publications that contain a given string in the title.

## `dev/lis-publication-search-element.html` ##
Create this development HTML page that implements the web component for testing. You need to create it so that you can test your web component 
locally under **web-components** rather than going back and forth between here and a separate web site. It will contain the code that you place on a 
page on a separate web site. The key things here are

1. the web component tag itself, called `<lis-publication-search-element>` here
2. the GraphQL query, held in the constant `publicationQuery` here
3. the function given to the web component search function, called `getPublications` here

```html
<html>
  <head>
    <meta charset="utf-8" />
    <title>LIS Web-Components - &lt;lis-publication-search-element&gt;</title>
    <!-- CSS framework -->
    <link rel="stylesheet" type="text/css" href="../node_modules/uikit/dist/css/uikit.min.css">
    <script src="../node_modules/uikit/dist/js/uikit.min.js"></script>
    <!-- web components polyfills -->
    <script src="../node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
    <script src="../node_modules/lit/polyfill-support.js"></script>
    <!-- GraphQL -->
    <script type="text/javascript" src="./graphql.js"></script>
    <!-- web components -->
    <script type="module" src="../dist/index.js"></script>
  </head>

  <body>
    <div class="uk-container">
      <h1>&lt;lis-publication-search-element&gt;</h1>
      <p>
        The <code>&lt;lis-publication-search-element&gt;</code> provides a form for performing publication searches and displays the results in a paginated table.
        The search is performed using an external function provided to the component when it is added to the page.
        In this example, the component performs a path query search for Publications using the LIS GraphQL API query <code>publications</code>.
        See the source code for details.
        Note that the form's input and page values are kept up to date in the URL query string parametrers.
        This allows users to share specific pages from a search via the URL and for the search history to be navigated via the Web browser's forward and back buttons.
        If the query string parameters are present when the component loads then a search will be automatically performed with the query string parameter values.
      </p>
      <hr>
      <!-- the custom publication search element -->
      <lis-publication-search-element id="publication-search"></lis-publication-search-element>
    </div>

    <!-- set the search function by property because functions can't be set as attributes -->
    <script type="text/javascript">
    
      // publication title search query for the LIS GraphQL API
      const publicationQuery = `
query Query($title: String!, $start: Int, $size: Int) {
  publications(title: $title, start: $start, size: $size) {
    year
    title
    journal
    firstAuthor
    doi
    pubMedId
  }
}
`;
      
      // the search function given to the LIS publication search Web Component
      function getPublications(searchData, page, {abortSignal}) {
          const title = searchData['query'];
          const pageSize = 10;
          const start = (page-1)*pageSize;
          // pageSize+1 because we want to see if there's a "next" page
          const variables = {title, start, size: pageSize+1};
          // returns a Promise that resolves to an array of Publication objects the publication search
          // Web Component knows how to parse: {name: string, name: string}[]
          return graphqlQuery(uri, publicationQuery, variables, abortSignal)
              .then(({data}) => {
                  // compute if there's a next page
                  const hasNext = pageSize+1 === data.publications.length;
                  // remove the lookahead result
                  if (hasNext) data.publications.pop();
                  // flatten results if they contain objects
                  const results = data.publications.map(publication => flatten(publication));
                  // construct the expected paginated results object
                  const paginatedResults = {
                      hasNext,
                      results,
                  };
                  return paginatedResults;
              });
      }

      const publicationSearchElement = document.getElementById('publication-search');
      publicationSearchElement.searchFunction = getPublications;

    </script>

  </body>
</html>
```

## `src/lis-publication-search-element.ts` ##
Create your web component by defining it in this new Typescript file. This file lists the flattened attributes provided by the function defined in the
HTML file above, and associates them with columns in the output table.
```typescript
import {LitElement, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';

import {LisPaginatedSearchMixin, PaginatedSearchOptions} from './mixins';


/**
 * The data that will be passed to the search function by the
 * {@link LisPublicationSearchElement | `LisPublicationSearchElement`} class when a search is
 * performed.
 */
export type PublicationSearchData = {
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
 * @param page What page of results the search is for. Will always be 1 when a
 * new search is performed.
 * @param options Optional parameters that aren't required to perform a Publication
 * search but may be useful.
 *
 * @returns A {@link !Promise | `Promise`} that resolves to an
 * {@link !Array | `Array`} of {@link PublicationSearchResult | `PublicationSearchResult`}
 * objects.
 */
export type PublicationSearchFunction =
    (query: string, page: number, options: PaginatedSearchOptions) => Promise<Array<PublicationSearchResult>>;


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
 *   function getPublications(searchText, page, {abortSignal}) {
 *     // returns a Promise that resolves to a search result object
 *   }
 *   // get the Publication search element
 *   const searchElement = document.getElementById('publication-search');
 *   // set the element's searchFunction property
 *   searchElement.searchFunction = getPublications;
 * </script>
 * ```
 */
@customElement('lis-publication-search-element')
export class LisPublicationSearchElement extends
LisPaginatedSearchMixin(LitElement)<PublicationSearchData, PublicationSearchResult>() {

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
            'year',
            'title',
            'journal',
            'firstAuthor',
            'doi',
            'pubMedId'
        ];
        this.tableHeader = {
            'year': 'Year',
            'title': 'Title',
            'journal': 'Journal',
            'firstAuthor': 'First Author',
            'doi': 'DOI',
            'pubMedId': 'PubMed'
        };
    }

    /** @ignore */
    // used by LisPaginatedSearchMixin to draw the template
    override renderForm() {
        return html`
<form>
<fieldset class="uk-fieldset">
<legend class="uk-legend">Publication title search (e.g. expression)</legend>
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
        'lis-publication-search-element': LisPublicationSearchElement;
    }
}
```
In this example, we tell the web component that it will receive the following attributes:
```
    year: number;
    title: string;
    journal: string;
    firstAuthor: string;
    doi: string;
    pubMedId: string;
```
and then display them in a table with the following headers:
```
   'year': 'Year',
   'title': 'Title',
   'journal': 'Journal',
   'firstAuthor': 'First Author',
   'doi': 'DOI',
   'pubMedId': 'PubMed'
```

## src/index.ts ##
Export our new web component:
```typescript
/**
 * This module contains higher-order Web Components that implement rich
 * functionality for end users of this library. This module re-exports
 * components from the core module for functionality reasons; the components
 * from the core module are not intended for users of this library.
 *
 *
 * @module user components
 */
export * from './core';
export * from './lis-gene-search-element';
... other exports ...
export * from './lis-publication-search-element';
```

## index.html ##
This development web page lists all the web components for testing within the **web-components** repo. Link the dev page you wrote in the 
first step here.
```html
    <ul class="uk-list uk-list-disc">
      <li><a href="/dev/lis-gene-search-element.html">&lt;lis-gene-search-element&gt;</a></li>
      ... other components ...
      <li><a href="/dev/lis-publication-search-element.html">&lt;lis-publication-search-element&gt;</a></li>
    </ul>
```

## Test your new web component ##
`$ npm run build` to compile the Typescript

`$ npm run serve` to run a local server for testing, which will serve the above `index.html` on port 8000.

## Package your web component ##
If your web component is working correctly,

`$ npm run package` to bundle it into `dist/web-components.bundled.js`.

You may now copy `web-components.bundled.js` to a web site where you want to implement your new web component.
