import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';


type Gene = {name: string; description: string; organism: {genus: string; species: string}; geneFamily: {name: string}}

@customElement('simple-table-element')
export class SimpleTableElement extends LitElement {

  // disable shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  @property({type: Array})
  genes: Gene[] = [];

  @property({type: String})
  searchTerm = "";

  override render() {
    // show whatever the user put inside the tags if there aren't any genes
    if (!this.genes.length) {
      return html`
        <slot></slot>
      `;
    }

    // what a table row will look like
    console.log(this.genes);
    console.log(this.searchTerm);
    const tableRows = this.genes.map(gene => {
        return html`
          <tr>
            <td>${gene.name}</td>
            <td>${gene.description}</td>
          </tr>
        `;
     });

    // draw a table containing the genes. Should there be a pho-form here that is used to access searchTerm?
    return html`
      <slot hidden></slot>
      <table class="uk-table uk-table-hover uk-table-divider uk-table-small">
        <caption>Gene List</caption>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'simple-table-element': SimpleTableElement;
  }
}
