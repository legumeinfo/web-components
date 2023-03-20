import {LitElement, html, css} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {LisSimpleTableElement} from './core';

/**
 * @htmlElement `<lis-linkout-search-element>`
 *
 * A Web Component that provides a generic table element.
 *
 */

export type LinkoutSearchData = {
  query: string;
  service: string;
}

export type LinkoutResult = {
  href: string;
  text: string;
  method: string;
}

export type LinkoutSearchResults<LinkoutResult> = {
  results: LinkoutResult[];
};

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
  // computes the rows for the component's table replace with search function
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
    this._fetchLinkouts();
    const dataAttributes = ['linkout']
    const header = {'linkout': 'Description'};
    // draw the table
    return html`
      <lis-simple-table-element
        caption="Linkout Results"
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
