import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';

import {LisPaginatedSearchMixin} from './mixins';


//export type GeneSearchResult = {
//  name: string;
//  description: string;
//};


// TODO: use template function
//export type GeneSearchFunction = SearchFunction;


@customElement('lis-gene-search-element')
export class LisGeneSearchElement extends LisPaginatedSearchMixin(LitElement) {

  constructor() {
    super();
    // configure results table
    this.resultAttributes = ['name', 'description'];
    this.tableHeader = {name: 'Name', description: 'Description'};
  }

  override renderForm() {
    return html`
      <form>
        <fieldset class="uk-fieldset">
          <legend class="uk-legend">Gene search</legend>
          <div class="uk-margin">
            <input
              name="query"
              class="uk-input"
              type="text"
              placeholder="Input"
              aria-label="Input">
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
    'lis-gene-search-element': LisGeneSearchElement;
  }
}
