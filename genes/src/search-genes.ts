type Species = {genus: string, species: string};


export class GeneSearch extends HTMLElement {

  private _params: {name: string, genus: string, species: string}[];
  private _species: Species[] = [];

  static get observedAttributes() {
    return ['geneSearchUrl'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    this._draw();
  }

  private _draw() {
    const geneLinkPrefix = this.getAttribute('geneSearchUrl');
    this.innerHTML = `
      <template>
        <option class="species"></option>
      </template>

      <form class="uk-form-horizontal uk-margin-large">
        <fieldset class="uk-fieldset">
          <legend class="uk-legend">Search</legend>
            <div class="uk-margin">
              <label class="uk-form-label" for="form-horizontal-select">Species</label>
              <div class="uk-form-controls">
                <select class="uk-select">
                </select>
              </div>
            </div>
            <div class="uk-margin">
              <label class="uk-form-label" for="form-horizontal-text">Gene Name</label>
              <div class="uk-form-controls">
                <input class="uk-input name" type="text">
              </div>
            </div>
          </legend>
        </fieldset>
        <div class="uk-margin">
          <button class="uk-button uk-button-primary">Search</button>
        </div>
      </form>
    `;
    const searchParams = new URLSearchParams(window.location.search)
    const speciesSelect = this.querySelector('select');
    const template: HTMLTemplateElement = this.querySelector('template');
    speciesSelect.innerHTML = '<option class="species">- Any -</option>';
    // set species select options
    this._species.forEach((s) => {
      // Create an instance of the template content
      const instance: DocumentFragment = document.importNode(template.content, true);
      // Add relevant content to the template
      instance.querySelector('.species').innerHTML = `${s.genus} ${s.species}`;
      if (s.genus === searchParams.get('genus') && s.species === searchParams.get('species')) {
        instance.querySelector('.species').setAttribute('selected', 'true');
      }
      // Append the instance ot the DOM
      speciesSelect.appendChild(instance);
    });
    // set gene name input
    const geneName = searchParams.get('name');
    if (geneName !== null) {
      const nameInput = this.querySelector('.name');
      nameInput.setAttribute('value', geneName);
    }
    // add button event listener
    const form = this.querySelector('form');
    form.addEventListener('submit', this.search.bind(this));
  }

  connectedCallback() {
    this._draw();
  }

  search(e) {
    e.preventDefault();
    // get the URL query (search) string parameters
    const searchParams = new URLSearchParams(window.location.search)
    // update the species
    const speciesSelect = this.querySelector('select');
    const i = speciesSelect.selectedIndex-1;
    if (i >= 0) {
      const selectedSpecies = this._species[i];
      searchParams.set('genus', selectedSpecies.genus);
      searchParams.set('species', selectedSpecies.species);
    } else {
      searchParams.delete('genus');
      searchParams.delete('species');
    }
    // update the name
    const nameInput: any = this.querySelector('.name');
    const geneName = nameInput.value;
    if (geneName !== '') {
      searchParams.set('name', geneName);
    } else {
      searchParams.delete('name');
    }
    // navigate
    window.location.search = searchParams.toString();
  }

  set species(species: Species[]) {
    this._species = species;
    this._draw();
  }
  
  get species() {
    return this._params;
  }

  set urlParams(params) {
    //this._genes = genes;
    this._draw();
  }
  
  get urlParams() {
    return this._params;
  }

}
    

customElements.define('lis-gene-search', GeneSearch);
