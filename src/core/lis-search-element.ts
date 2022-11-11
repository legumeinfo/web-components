import {LitElement, html} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';


@customElement('lis-search-element')
export class LisSearchElement extends LitElement {

  // disable shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  // the text displayed in the search form's legend
  @property({type: String})
  legend = '';

  // the text in the search form's input
  @property({type: String})
  input = '';

  // bind to the input element in the template
  @query('input')
  _input!: HTMLInputElement;

  // called when the form in the template is submitted
  private _submit(e: Event) {
    e.preventDefault();
    e.stopPropagation();  // we'll emit our own event
    const value: string = this._input.value.trim();
    this.input = value;
    const options = {
      detail: {value},
      bubbles: true,
      composed: true
    };
    this.dispatchEvent(new CustomEvent('submit', options));
  }

  private _getLegend() {
    if (!this.legend) {
      return html``;
    }
    return html`<legend class="uk-legend">${this.legend}</legend>`;
  }

  // the template
  override render() {

    const legend = this._getLegend();

    return html`
      <form @submit="${this._submit}">
        <fieldset class="uk-fieldset">
          ${legend}
          <div class="uk-margin">
            <input
              class="uk-input"
              type="text"
              placeholder="Input"
              aria-label="Input"
              value="${this.input}">
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
    'lis-search-element': LisSearchElement;
  }
}
