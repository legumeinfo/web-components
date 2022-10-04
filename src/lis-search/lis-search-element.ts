import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';


//type Gene = {name: string; description: string; organism: {genus: string; species: string}; geneFamily: {name: string}}

@customElement('lis-search-element')
export class LisSearchElement extends LitElement {

  // disable shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  @property({type: String})
  searchTerm = "";

  override render() {
    // show whatever the user put inside the tags if there aren't any genes
//    if (!this.searchTerm) {
//      return html`
//        <slot></slot>
//      `;
//    }
//
//    // what a table row will look like
//    console.log(this.genes);
//    console.log(this.searchTerm);
//    const tableRows = this.genes.map(gene => {
//        return html`
//          <tr>
//            <td>${gene.name}</td>
//            <td>${gene.description}</td>
//          </tr>
//        `;
//     });

    // draw a table containing the genes. Should there be a pho-form here that is used to access searchTerm?
    return html`
      <slot hidden></slot>
         <h3>Please Input a Search Term Below To Find Specific Genes</h3>
         <div class="uk-margin">
           <input class="uk-input" id="search-term" type="text" size=50>
         </div>
         <div class="uk-margin">
           <button class="uk-button uk-button-default" id="submit-search">Search</button>
         </div>
    `;
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'lis-search-element': LisSearchElement;
  }
}
