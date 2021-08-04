type Gene = {name: string, genus: string, species: string};


export class ListGenes extends HTMLElement {

  private _genes: Gene[];

  static get observedAttributes() {
    return ['geneLinkPrefix'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    this._draw();
  }

  private _draw() {
    const geneLinkPrefix = this.getAttribute('geneLinkPrefix');
    this.innerHTML = `
      <template>
        <tr>
          <td><a class="name" href="#"></a></td>
          <td class="species"></td>
        </tr>
      </template>

      <table class="uk-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Species</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    `;
    if (this._genes !== undefined) {
      const geneList = this.querySelector('tbody');
      const template: HTMLTemplateElement = this.querySelector('template');
      geneList.innerHTML = '';
      this._genes.forEach((g) => {
        // Create an instance of the template content
        const instance: DocumentFragment = document.importNode(template.content, true);
        // Add relevant content to the template
        instance.querySelector('.name').innerHTML = g.name;
        const url = geneLinkPrefix+g.name;
        instance.querySelector('.name').setAttribute('href', url);
        instance.querySelector('.species').innerHTML = `${g.genus} ${g.species}`;
        // Append the instance ot the DOM
        geneList.appendChild(instance);
      });
    }
  }

  connectedCallback() {
    this._draw();
  }

  set genes(genes: Gene[]) {
    this._genes = genes;
    this._draw();
  }
  
  get genes(): Gene[] {
    return this._genes;
  }

}
    

customElements.define('lis-gene-list', ListGenes);
