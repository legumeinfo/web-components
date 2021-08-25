// This file uses mixins to allow the same extension to be added to multiple
// HTML elements. See the TypeScript Handbook for more details on class mixins:
// https://www.typescriptlang.org/docs/handbook/mixins.html


// only HTMLElement classes can use the mixin
type Constructor = new (...args: any[]) => HTMLElement;


// the mixin, i.e. a class factory
function repeatTemplateFactory<TBase extends Constructor>(Base: TBase) {

  return class RepeatTemplate extends Base {

    // properties
  
    _rowTemplate: HTMLTemplateElement;
    _listContainer: HTMLElement;
  
    set data(data: object[]) {
      this.setAttribute('data', JSON.stringify(data));
    }
  
    get data(): object[] {
      return JSON.parse(this.getAttribute('data'));
    }
  
    static get observedAttributes() {
      return ['data'];
    }
  
    // callbacks
  
    connectedCallback() {
      // check's if the template element is in the DOM and initializes if it is
      const checkTemplate = () => {
          const template = this.querySelector('template');
          if (template) {
            this._initialize();
            return true;
          }
          return false;
        };
      // initialize if the template is already in the DOM
      if (checkTemplate()) {
        return;
      }
      // otherwise, create a MutationObserver to wait for the template
      new MutationObserver((records, observer) => {
        if (checkTemplate()) {
          // disconnect the observer once the template is loaded
          observer.disconnect();
        }
      }).observe(this, {childList: true, subtree: true});
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
      this._draw();
    }
  
    // methods
  
    _initialize() {
      // get the row template
      this._rowTemplate = this.querySelector('template');
      if (!this._rowTemplate) {
        throw `${this.constructor.name} cannot be initialized without a template descendant`;
      }
      // get the row template's parent
      this._listContainer = this._rowTemplate.parentElement;
      // draw after initializing
      this._draw();
    }
  
    _draw() {
      // make sure we have a row template and a container to put rows in
      if (!this._rowTemplate || !this._listContainer) {
        return;
      }
      // reset the container's content
      this._listContainer.innerHTML = '';
      if (!this.data) {
        return;
      }
      // extract the variables from the template
      const variables: [string, string][] =
        Array.from(this._rowTemplate.innerHTML.matchAll(/\{\~(.*?)\~\}/g))
          .map(([match, variable]) => [match, variable.trim()]);
      const variableMap = new Map(variables);
      // add a row for each datum
      this.data.forEach((g) => {
        // create an instance of the template content
        const rowNode
          = this._rowTemplate.content.cloneNode(true) as DocumentFragment;
        const row = rowNode.querySelector('tr');
        // get the datum's value for each variable
        variableMap.forEach((variable, match) => {
          const value = (variable in g ? g[variable] : '');
          row.innerHTML = row.innerHTML.replace(new RegExp(match, 'g'), value);
        });
        // append the row to the DOM
        this._listContainer.appendChild(rowNode);
      });
    }
  
  };

}


// add the mixin to multiple elements
export class RepeatTemplateTable extends repeatTemplateFactory(HTMLTableElement) { };
customElements.define('lis-repeat-template-table', RepeatTemplateTable, {extends: 'table'});

export class RepeatTemplateUList extends repeatTemplateFactory(HTMLUListElement) { };
customElements.define('lis-repeat-template-ul', RepeatTemplateUList, {extends: 'ul'});

export class RepeatTemplateOList extends repeatTemplateFactory(HTMLOListElement) { };
customElements.define('lis-repeat-template-ol', RepeatTemplateOList, {extends: 'ol'});


// example use:
//
// <table is="lis-template-table" data='[{"genus": "Glycine", "species": "max", "name": "soybean"}]'>
//   <thead>
//     <tr>
//       <th>Genus</th>
//       <th>Species</th>
//       <th>Name</th>
//   </thead>
//   <tbody>
//     <template>
//       <tr>
//         <td>{~ genus ~}</td>
//         <td>{~ species ~}</td>
//         <td>{~ name ~}</td>
//       </tr>
//     </template>
//   </tbody>
// </table>
