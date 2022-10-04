export class ViewGene extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<h1>Hello, Gene!</h1>`;
  }
}
    

customElements.define('lis-gene-view', ViewGene);
