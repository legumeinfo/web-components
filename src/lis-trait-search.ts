import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';

import {LisPaginatedSearchMixin} from './mixins';


export type TraitSearchData = {
  query: string;
};


export type TraitSearchResult = {
  name: string;
  description: string;
};



@customElement('lis-trait-search-element')
export class LisTraitSearchElement extends
LisPaginatedSearchMixin(LitElement)<TraitSearchData, TraitSearchResult>() {

  constructor() {
    super();
    // configure query string parameters
    this.requiredQueryStringParams = ['query'];
    // configure results table
    this.resultAttributes = ['name', 'description'];
    this.tableHeader = {name: 'Name', description: 'Description'};
  }

  override renderForm() {
    return html`
      <form>
        <fieldset class="uk-fieldset">
          <legend class="uk-legend">Trait search</legend>
          <div class="uk-margin">
            <input
              name="query"
              class="uk-input"
              type="text"
              placeholder="Input"
              aria-label="Input"
              value=${this.queryStringController.getParameter('query')}>
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
    'lis-trait-search-element': LisTraitSearchElement;
  }
}
