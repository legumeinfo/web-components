import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';


/**
 * A Web Component that provides a pagination UI element.
 *
 * @fires pageChange - Fired when the page changes. Dispatches a `CustomEvent`
 * containing the new value of the `page` property.
 *
 * @example <caption>The pagination element's
 * <code class="language-js">page</code> attribute/property can be initialized
 * via HTML or JavaScript. It will default to 1 if no value is provided:
 * </caption>
 * ```html
 * <!-- page attribute/property will be given default value of 1 -->
 * <lis-pagination-element></lis-pagination-element>
 *
 * <!-- setting the page attribute/property via HTML -->
 * <lis-pagination-element page=2></lis-pagination-element>
 *
 * <!-- setting the page attribute/property via JavaScript -->
 * <lis-pagination-element id="pagination"></lis-pagination-element>
 * <script type="text/javascript">
 *   // get the pagination element
 *   const paginationElement = document.getElementById('pagination');
 *   // set the element's page property
 *   paginationElement.page = 3;
 * </script>
 * ```
 *
 * @example <caption>The pagination element can also go to the next/previous
 * <code class="language-js">page</code> programmatically using the
 * <code class="language-js">next</code> and
 * <code class="language-js">previous</code> methods:</caption>
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-pagination-element id="pagination"></lis-pagination-element>
 *
 * <!-- interact with the component via JavaScript -->
 * <script type="text/javascript">
 *   // get the pagination element
 *   const paginationElement = document.getElementById('pagination');
 *   // go to the next page
 *   paginationElement.next();
 *   // go to the previous page
 *   paginationElement.previous();
 * </script>
 *
 * @example <caption>Every time the <code class="language-js">page</code>
 * attribute/property changes, a <code class="language-js">pageChange</code>
 * event is dispatched. The event can be observed and the new page value can be
 * extracted from the event as follows:</caption>
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-pagination-element id="pagination"></lis-pagination-element>
 *
 * <!-- interact with the component via JavaScript -->
 * <script type="text/javascript">
 *   // get the pagination element
 *   const paginationElement = document.getElementById('pagination');
 *   // an function to handle pageChange events
 *   function eventHandler(event) {
 *     const page = event.detail.page;
 *     console.log(page);  // 1
 *   }
 *   // subscribe to pageChange events
 *   paginationElement.addEventListener('pageChange', eventHandler);
 * </script>
 * ```
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
