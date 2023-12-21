import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

/**
 * @htmlElement `<lis-form-input-example-element>`
 *
 * A Web Component that provides a consistent example text element for form inputs.
 *
 * @example
 * The element's {@link text | `text`} attribute/property can be set via HTML or
 * JavaScript.
 *
 * For example:
 * ```html
 * <!-- set the text via HTML -->
 * <lis-from-input-example-element text="This is the example text"></lis-from-input-example-element>
 *
 * <!-- set the text via JavaScript -->
 * <lis-from-input-example-element id="example"></lis-from-input-example-element>
 *
 * <script type="text/javascript">
 *   // get the example element.
 *   const exampleElement = document.getElementById('example');
 *   // set the element's example property
 *   exampleElement.text = 'This is also example text';
 * </script>
 * ```
 */
@customElement('lis-form-input-example-element')
export class LisFormInputexampleElement extends LitElement {
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
   * The text to show in the example element.
   *
   * @attribute
   */
  @property({type: String})
  text?: string;

  /** @ignore */
  // returns the modal heading portion of the component
  private _getexampleElement() {
    if (!this.text) {
      return html``;
    }
    return html`<span class="uk-text-small"
      >e.g. ${unsafeHTML(this.text)}</span
    >`;
  }

  /** @ignore */
  // used by Lit to draw the template
  override render() {
    const exampleElement = this._getexampleElement();
    return html`${exampleElement}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-form-input-example-element': LisFormInputexampleElement;
  }
}
