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
   * The caption shown for the modal window.
   *
   * @attribute
   */
  @property({type: String})
  caption: string = '';

  /**
   * An ordered list of objects to populate the modal.
   *
   * @attribute
   */
  @property({type: Array<string>})
  data: Array<string> = [];

  /** @ignore */
  // converts an object to a table row. If link is not null build <a> else <p>
  private _objectToTable(o: Object, cellTag: string='td') {
    const startTag = `<${cellTag}>`;
    const endTag = `</${cellTag}>`;
    const link = o.hasOwnProperty('href') ? o['href' as keyof typeof o] : null;
    const text = o.hasOwnProperty('text') ? o['text' as keyof typeof o] : '';
    const linkout = link ? `<a href="${link}">${text}</a>` : `<p>${text}</p>`;
    const cell = startTag + linkout + endTag;
    return html`<tr>${unsafeHTML(cell)}</tr>`;
  }

  /** @ignore */
  // computes the caption part of the component's table
  private _getCaption() {
    if (!this.caption) {
      return html``;
    }
    return html`<caption>${this.caption}</caption>`;
  }

  /** @ignore */
  private _getBody() {
    if (!this.data) {
      return html``;
    }
    const rows = this.data.map((o) => this._objectToTable(o));
    return html`<tbody>${rows}</tbody>`;
  }

  /** @ignore */
  // used by Lit to draw the template
  override render() {

    // compute modal parts
    const caption = this._getCaption();
    const body = this._getBody();

    // draw the modal
    return html`
      <div id="lis-modal" class="uk-modal">
        <div class="uk-modal-dialog">
          <button class="uk-modal-close-default" type="button" uk-close></button>
          <div class="uk-modal-header">
            ${caption}
          </div>
          <div class="uk-modal-body" uk-overflow-auto>
            <table>
              ${body}
            </table>
          </div>
        </div>
        <slot></slot>
      </div>
    `;
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'lis-modal-element': LisModalElement;
  }
}
