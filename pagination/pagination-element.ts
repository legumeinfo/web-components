import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';


@customElement('pagination-element')
export class PaginationElement extends LitElement {

  // disable shadow DOM
  override createRenderRoot() {
    return this;
  }

  @property({type: Number})
  page: number = 1;

  override render() {
    return html`
      <ul class="uk-pagination">
          <li><a href="#" @click=${this._previousPage}><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li>
          <li class="uk-active"><span>Page ${this.page}</span></li>
          <li class="uk-margin-auto-left"><a href="#" @click=${this._nextPage}>Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li>
      </ul>
    `;
  }

  private _previousPage(e: MouseEvent) {
    // don't follow the link (href)
    e.preventDefault();
    // go to the previous page
    if (this.page > 1) {
      this.page -= 1;
      this._dispatchPageChange();
    }
  }

  private _nextPage(e: MouseEvent) {
    // don't follow the link (href)
    e.preventDefault();
    // go to the next page
    this.page += 1;
    this._dispatchPageChange();
  }

  private _dispatchPageChange() {
    const options = {
      detail: {page: this.page},
      bubbles: true,
      composed: true
    };
    this.dispatchEvent(new CustomEvent('pageChange', options));
  }

}


declare global {
  interface HTMLElementTagNameMap {
    'pagination-element': PaginationElement;
  }
}
