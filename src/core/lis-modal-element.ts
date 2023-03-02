import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';


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

  /**
   * The text or HTML to populate uk-modal-header
   *
   * @attribute
   */
  @property({type: String})
  header: string = "";

  /**
   * The text or HTML to populate uk-modal-body
   *
   * @attribute
   */
  @property({type: String})
  content: string = "";

  /** @ignore */
  // returns the modal header portion of the component
  private _getHeader() {
    if (!this.header) {
      return html``;
    }
    return html`<div class="uk-modal-header">${unsafeHTML(this.header)}</div>`;
  }

  private _getContent() {
    if (!this.content) {
      return html``;
    }
    return html`<div class="uk-modal-body" uk-overflow-auto>${unsafeHTML(this.content)}</div>`;
  }


  /** @ignore */
  // used by Lit to draw the template
  override render() {
    
    const header = this._getHeader();
    const content = this._getContent();
    // draw the modal
    return html`
    <div id="modal-overflow" uk-modal>
      <div class="uk-modal-dialog">
        <button class="uk-modal-close-default" type="button" uk-close></button>
	${header}
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
