import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';


/**
 * @htmlElement `<lis-modal-element>`
 *
 * A Web Component that provides a generic modal element.
 *
 * @example
 * The modal element's
 * {@link name | `name`}, {@link heading | `heading`}, and
 * {@link content | `content`} attributes/properties can be set via HTML or
 * javascript.
 *
 * For example:
 * ```html
 * <!-- set the name, heading and content via HTML -->
 * <lis-modal-element
 *   name="modal-test"
 *   heading="Test Modal">
 *     <p>Some HTML or text to be rendered</p>
 * </lis-modal-element>
 * ```
 *
 * @example
 * In the example below, the lis-simple-table-element web component
 * is rendered within the lis-modal-element.
 *
 * The attributes/properties for lis-simple-table-element are set below
 * in javascript. Please see the documentation for lis-simple-table-element
 * for more information.
 *
 * ```html
 * <lis-modal-element 
 *   name="modal-test" 
 *   heading="Cheesy Table Modal">
 *     <lis-simple-table-element
 *       id="table">
 *     </lis-simple-table-element>
 * </lis-modal-element>
 * 
 * <script type="text/javascript">
 *  // get the simple table element after page loads.
 *  window.onload = (event) => {
 *   console.log("page is fully loaded");
 *
 *   const tableElement = document.getElementById('table');
 *   // set the element's properties
 *   tableElement.caption = 'My cheesy table';
 *   tableElement.dataAttributes = ['cheese', 'region'];
 *   tableElement.header = {cheese: 'Cheese', region: 'Region'};
 *   tableElement.data = [
 *     {cheese: 'Brie', region: 'France'},
 *     {cheese: 'Burrata', region: 'Italy'},
 *     {cheese: 'Feta', region: 'Greece'},
 *     {cheese: 'Gouda', region: 'Netherlands'},
 *   ];
 *  }
 * </script>
 * ```
 */
@customElement('lis-modal-element')
export class LisModalElement extends LitElement {

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
   * The text to use as the Id for the uk-modal.
   * This is used to bind buttons to show/hide.
   *
   * @attribute
   */
  @property({type: String})
  name: string = "lis-modal";

  /**
   * The text or HTML to populate uk-modal-header
   *
   * @attribute
   */
  @property({type: String})
  heading: string = "";

  /** @ignore */
  // returns the modal heading portion of the component
  private _getHeading() {
    if (!this.heading) {
      return html``;
    }
    return html`<div class="uk-modal-header">${unsafeHTML(this.heading)}</div>`;
  }

  /** @ignore */
  // returns the content provided in the modal-body
  private _getContent() {
    if (!this.children) {
      return html``;
    }
    return html`<div class="uk-modal-body" uk-overflow-auto>${Array.from(this.children)}</div>`;
  }

  /** @ignore */
  // used by Lit to draw the template
  override render() {
    
    const heading = this._getHeading();
    const content = this._getContent();
    // draw the modal
    return html`
    <div id="${this.name}" uk-modal>
      <div class="uk-modal-dialog">
        <button class="uk-modal-close-default" type="button" uk-close></button>
	${heading}
	${content}
      </div>
    </div>
    `;
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'lis-modal-element': LisModalElement;
  }
}
