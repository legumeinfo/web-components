import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';


/**
 * A Web Component that provides a pagination UI element.
 *
 * @fires pageChange - Fired when the page changes. Dispatches a `CustomEvent`
 * containing the new value of the `page` property.
 */
@customElement('lis-pagination-element')
export class LisPaginationElement extends LitElement {

  /**
   * @ignore
   */
  // disable shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  /**
   * What page the element is currently on.
   */
  @property({type: Number})
  page: number = 1;

  /**
   * Programmatically go to the previous page.
   *
   * @param e - An optional event that can be passed if called via a UI event,
   * for example.
   */
  previous(e?: Event): void {
    if (e !== undefined) {
      e.preventDefault();
    }
    if (this.page > 1) {
      this.page -= 1;
      this._dispatchPageChange();
    }
  }

  /**
   * Programmatically go to the next page.
   *
   * @param e - An optional event that can be passed if called via a UI event,
   * for example.
   */
  next(e?: Event): void {
    if (e !== undefined) {
      e.preventDefault();
    }
    this.page += 1;
    this._dispatchPageChange();
  }

  // emits a 'pageChange' event
  private _dispatchPageChange(): void {
    const options = {
      detail: {page: this.page},
      bubbles: true,
      composed: true
    };
    this.dispatchEvent(new CustomEvent('pageChange', options));
  }

  override render() {
    return html`
      <ul class="uk-pagination">
          <li><a href="" @click=${this.previous}><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li>
          <li class="uk-active"><span>Page ${this.page}</span></li>
          <li class="uk-margin-auto-left"><a href="" @click=${this.next}>Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li>
      </ul>
    `;
  }

}


declare global {
  interface HTMLElementTagNameMap {
    'lis-pagination-element': LisPaginationElement;
  }
}
