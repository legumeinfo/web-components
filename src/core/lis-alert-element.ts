import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

import {LisSlotController} from '../controllers';
import {AlertModifierModel} from '../models';


/**
 * @htmlElement `<lis-alert-element>`
 *
 * A Web Component that provides a generic alert element.
 *
 * @slot - Adds content in place of the content defined via the component properties.
 *
 * @example
 * The alert element's {@link content | `content`} and {@link type | `type`}
 * attributes/properties can be set via HTML or JavaScript. For example:
 * ```html
 * <!-- set the content and type attributes/properties via HTML -->
 * <lis-alert-element
 *   content="<p>My important message</p>"
 *   type="success">
 * </lis-alert-element>
 *
 * <!-- set all attributes/properties via JavaScript -->
 * <lis-alert-element id="alert"></lis-alert-element>
 * <script type="text/javascript">
 *   // get the alert element
 *   const alertElement = document.getElementById('alert');
 *   // set the element's properties
 *   alertElement.content = '<p>My important message</p>';
 *   alertElement.type = 'success';
 * </script>
 * ```
 *
 * @example
 * The alert element's {@link content | `content`} and {@link type | `type`}
 * attributes/properties can also be set via class methods in JavaScript. For example:
 * ```html
 * <!-- set all attributes/properties via class method in JavaScript -->
 * <lis-alert-element id="alert"></lis-alert-element>
 * <script type="text/javascript">
 *   // get the alert element
 *   const alertElement = document.getElementById('alert');
 *   // set the element's properties via method
 *   alertElement.success('<p>My important message</p>', 'success');
 * </script>
 * ```
 *
 * @example
 * Alternatively, an alert's contents can be written in HTML using the element's
 * slot. Note that this will override any content assigned via JavaScript. The alert's
 * {@link type | `type`} attribute/property must still be set via HTML or JavaScript.
 * For example:
 * ```html
 * <!-- set the type attributes/property via HTML and the content via slot -->
 * <!-- NOTE: this is the alert produced by the previous examples -->
 * <lis-alert-element type="success">
 *   <p>My important message</p>
 * </lis-alert-element>
 * ```
 */
@customElement('lis-alert-element')
export class LisAlertElement extends LitElement {

  /** @ignore */
  // used by Lit to style the Shadow DOM
  // not necessary but exclusion breaks TypeDoc
  static override styles = css``;

  /** @ignore */
  // disable Shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  protected defaultSlotRef: Ref<HTMLSlotElement> = createRef();

  // a controller the preserves slot functionality when the Shadow DOM is disabled
  protected slotController: LisSlotController;

  /**
   * Whether or not to show a close button.
   *
   * @attribute
   */
  @property({type: Boolean})
  closeable: boolean = false;

  /**
   * The content of the alert element. This will be overridden content in the
   * component's slot.
   *
   * @attribute
   */
  @property({type: String})
  content: string = '';

  /**
   * The style of the alert element.
   *
   * @attribute
   */
  @property({type: String})
  type: AlertModifierModel|'' = '';

  constructor() {
    super();
    this.slotController = new LisSlotController(this, this.defaultSlotRef);
  }

  public updateAlert(content: string, type: AlertModifierModel|'') {
    this.content = content;
    this.type = type;
  }

  public basic(content: string) {
    this.updateAlert(content, '');
  }

  public primary(content: string) {
    this.updateAlert(content, 'primary');
  }

  public success(content: string) {
    this.updateAlert(content, 'success');
  }

  public warning(content: string) {
    this.updateAlert(content, 'warning');
  }

  public danger(content: string) {
    this.updateAlert(content, 'danger');
  }

  private _renderClassModifier() {
    if (this.type == '') {
      return '';
    }
    return `uk-alert-${this.type}`;
  }

  private _renderClose() {
    if (!this.closeable) {
      return html``;
    }
    return html`<a class="uk-alert-close" uk-close></a>`;
  }

  /** @ignore */
  // used by Lit to draw the template
  override render() {
    const alertClass = this._renderClassModifier();
    const close = this._renderClose();
    return html`
      <div class="uk-alert ${alertClass}" uk-alert>
        ${close}
        <p ${ref(this.defaultSlotRef)}>${unsafeHTML(this.content)}</p>
      </div>
    `;
  }

}


declare global {
  interface HTMLElementTagNameMap {
    'lis-alert-element': LisAlertElement;
  }
}
