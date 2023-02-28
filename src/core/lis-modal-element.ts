import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';


/**
 * @htmlElement `<lis-modal-element>`
 *
 * A Web Component that provides a generic modal element.
 *
 * @slot - Adds content after the content defined via the component properties.
 * Can be used to manually create a modal that has the same styling as the
 * component.
 *
 * @example
 * ADD FULL EXAMPLES
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

  /** @ignore */
  // returns the modal header portion of the component
  //private _getHeader() {
  //  if (!this.header) {
  //    return html``;
  //  }
  //  return html`<div class="uk-modal-header">${this.header}</div>`;
  //}


  /** @ignore */
  // used by Lit to draw the template
  override render() {

    // draw the modal
    return html`
    <div id="modal-overflow" uk-modal>
      <div class="uk-modal-dialog">
        <button class="uk-modal-close-default" type="button" uk-close></button>
        <div class="modal-header">
          <slot name="header"><h1>Modal Header</h1></slot>
        </div>
        <div class="uk-modal-body" uk-overflow-auto>
          <slot></slot>
        </div>
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
