import {LitElement, html} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';


/**
 * A Web Component that provides a generic search form.
 *
 * @fires submit - Fired when the form is submitted. Dispatches a `CustomEvent`
 * containing the text from the input element of the form.
 */
@customElement('lis-search-element')
export class LisSearchElement extends LitElement {

  /**
   * @ignore
   */
  // disable shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  /**
   * The text displayed in the search form's legend.
   */
  @property({type: String})
  legend = '';

  /**
   * The text in the search form's input.
   */
  @property({type: String})
  input = '';

  // bind to the input element in the template
  @query('input')
  private _input!: HTMLInputElement;

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

  // generates the legend part of the component's HTML
  private _getLegend() {
    if (!this.legend) {
      return html``;
    }
    return html`<legend class="uk-legend">${this.legend}</legend>`;
  }

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
