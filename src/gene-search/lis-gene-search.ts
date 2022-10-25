import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

//type Gene = {name: string; description: string; organism: {genus: string; species: string}; geneFamily: {name: string}}

@customElement('gene-search-element')
export class GeneSearchElement extends LitElement {

  // disable shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  @property({type: String})
  searchTerm = "";

  override render() {
    // use multiple components to render a form, draw a table containing the genes and paginate.
    return html`
    <slot hidden></slot>
    <div class="uk-container">
      <lis-search-element id="lis-search"></lis-search-element>
      <gene-list-element id="gene-list">
        <div uk-spinner></div>
      </gene-list-element>
      <pagination-element id="pagination"></pagination-element>
    </div>
    `;
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'gene-search-element': GeneSearchElement;
  }
}
