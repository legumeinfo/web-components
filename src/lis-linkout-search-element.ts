import {LitElement, html, css} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {LisSimpleTableElement} from './core';

/**
 * @htmlElement `<lis-linkout-search-element>`
 *
 * A Web Component for querying an instance of
 * the LIS linkout microservice and displaying 
 * the results in an instance of `<lis-simple-table-element>`
 *
 */

// LinkoutSearchData. Provide a query and a service.
export type LinkoutSearchData = {
  query: string;
  service: string;
}

// LinkoutResult object from linkout microservice.
export type LinkoutResult = {
  href: string;
  text: string;
  method: string;
}

// LikoutSearchResults array for LinkoutResult objects.
export type LinkoutSearchResults<LinkoutResult> = {
  results: LinkoutResult[];
};

// Function for searching the linkout microservice.
export type LinkoutSearchFunction<LinkoutSearchData> =
  (searchData: LinkoutSearchData) =>
    Promise<LinkoutSearchResults<LinkoutResult>>;

@customElement('lis-linkout-search-element')
export class LisLinkoutSearchElement extends LitElement {

  /** @ignore */
  // used by Lit to style the Shadow DOM
  // not necessary but exclusion breaks TypeDoc
  static override styles = css``;

  /** @ignore */
  // disable Shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  /** @ignore */
  // overrides the default attributeChangedCallback to add this._fetchLinkouts() after constructor callback
  override attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null) {
    super.attributeChangedCallback(name, oldVal, newVal);
    this._fetchLinkouts();
  }

  /**
   * The query string for the linkout service.
   *
   * @attribute
   */
  @property({type: String})
  queryString: string = '';

  /**
   * The service to use from the linkout service. default: gene_linkouts
   *
   * @attribute
   */
  @property({type: String})
  service: string = 'gene_linkouts';

  // the search callback function; not an attribute because functions can't be
  // parsed from attributes
  @property({type: Function, attribute: false})
  searchFunction: LinkoutSearchFunction<LinkoutSearchData> =
    () => Promise.reject(new Error('No search function provided'));

  // bind to the table element in the template
  @query('lis-simple-table-element')
  private _table!: LisSimpleTableElement;

  /** @ignore */
  // Fetches results from the linkout service and returns an Array of objects containing hyperlinks
  private _fetchLinkouts() {
    if(!this.queryString){
      return html``;
    }
    const domain = 'https://cicer.legumeinfo.org';
    const attributes = `${this.service}?${this.queryString}/json`;
    const url = domain + '/services/' + attributes;
    const linkoutRequest = fetch(url).then((response) => response.json()).then(
     (data) => {
                 const results = data.map(
                                       (d: LinkoutResult) => ({linkout: `<a href="${d.href}">${d.text}.</a>`})
                                      );
                 this._table.data = results;
               });
    return linkoutRequest;
  }

  /** @ignore */
  // used by Lit to draw the template
  override render() {

    // compute table parts
    const dataAttributes = ['linkout']
    const header = {'linkout': 'Linkouts'};
    // draw the table
    return html`
      <lis-simple-table-element
        caption=""
        .dataAttributes=${dataAttributes}
        .header=${header}>
      </lis-simple-table-element>
      <slot></slot>
    `;
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'lis-linkout-search-element': LisLinkoutSearchElement;
  }
}
