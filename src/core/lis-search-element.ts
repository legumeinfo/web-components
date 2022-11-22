import {LitElement, html, css} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';


/**
 * A Web Component that provides a generic search form.
 *
 * @example
 * The search form element's
 * {@link legend | `legend`} and {@link input | `input`} attributes/properties
 * can be initialized via HTML and/or JavaScript. Both default to the empty
 * string if no value is provided:
 * ```html
 * <!-- legend and input attributes/properties will be given default value of '' -->
 * <lis-search-element></lis-search-element>
 *
 * <!-- setting the legend and input attributes/properties via HTML -->
 * <lis-search-element legend="My search element" input="My search term"></lis-search-element>
 *
 * <!-- setting the legend and input attributes/properties via JavaScript -->
 * <lis-search-element id="search"></lis-search-element>
 * <script type="text/javascript">
 *   // get the search element
 *   const searchElement = document.getElementById('search');
 *   // set the element's legend property
 *   paginationElement.legend = "Best legend ever";
 *   // set the element's input property
 *   paginationElement.input = "Best input ever";
 * </script>
 * ```
 *
 * @example
 * Every time the search element's form is submitted, a
 * {@link submit | `submit`} event is dispatched. The event can be
 * observed and the new {@link input | `input`} value can be extracted from the
 * event as follows:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-search-element input="root nodule" id="search"></lis-search-element>
 *
 * <!-- interact with the component via JavaScript -->
 * <script type="text/javascript">
 *   // get the search element
 *   const searchElement = document.getElementById('search');
 *   // a function to handle submit events
 *   function eventHandler(event) {
 *     const input = event.detail.value;
 *     console.log(input);  // "root nodule"
 *   }
 *   // subscribe to submit events
 *   paginationElement.addEventListener('submit', eventHandler);
 * </script>
 * ```
 */
@customElement('lis-search-element')
export class LisSearchElement extends LitElement {

  /**
   *
   * Fired when the form is submitted. Dispatches a
   * {@link !CustomEvent | `CustomEvent`} containing the text from the input
   * element of the form.
   * @eventProperty
   */
  static readonly submit: CustomEvent<{input: string}>;

  /** @ignore */
  // used by Lit to style the Shadow DOM
  // not necessary but exclusion breaks TypeDoc
  static override styles = css``;

  /** @ignore */
  // disable Shadow DOM to inherit global styles
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
    const event = new CustomEvent('submit', options);
    this.dispatchEvent(event);
  }

  // generates the legend part of the component's HTML
  private _getLegend() {
    if (!this.legend) {
      return html``;
    }
    return html`<legend class="uk-legend">${this.legend}</legend>`;
  }

  /** @ignore */
  // used by Lit to draw the template
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
