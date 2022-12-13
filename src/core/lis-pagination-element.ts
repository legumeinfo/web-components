import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';


/**
 * @htmlElement `<lis-pagination-element>`
 *
 * A Web Component that provides a pagination UI element.
 *
 * @example
 * The pagination element's {@link page | `page`} attribute/property can be
 * initialized via HTML or JavaScript. It will default to 1 if no value is
 * provided:
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
 * @example
 * The pagination element can also go to the next/previous {@link page | `page`}
 * programmatically using the {@link next | `next`} and
 * {@link previous | `previous`} methods:
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
 * ```
 *
 * @example
 * Every time the {@link page | `page`} attribute/property changes, a
 * {@link pageChange | `pageChange`} event is dispatched. The event can be
 * observed and the new {@link page | `page`} value can be extracted from the
 * event as follows:
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
   * Fired when the page changes. Dispatches a
   * {@link !CustomEvent | `CustomEvent`} containing the new value of the
   * {@link page | `page`} property.
   * @eventProperty
   */
  static readonly pageChange: CustomEvent<{page: number}>;

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
   * What page the element is currently on.
   */
  @property({type: Number})
  page: number = 1;

  /**
   * Whether or not the next button should be enabled.
   */
  @property({type: Boolean})
  hasNext: boolean = false;

  /**
   * Programmatically go to the previous page.
   *
   * @param e - An optional {@link !Event | `Event`} that can be passed if
   * called via a UI event,
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
   * @param e - An optional {@link !Event | `Event`} that can be passed if
   * called via a UI event,
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
    const event = new CustomEvent('pageChange', options);
    this.dispatchEvent(event);
  }

  /** @ignore */
  // used by Lit to draw the template
  private _renderPreviousClass(): string {
    if (this.page > 1) {
      return '';
    }
    return 'uk-disabled';
  }

  /** @ignore */
  // used by Lit to draw the template
  private _renderNextClass(): string {
    if (this.hasNext) {
      return '';
    }
    return 'uk-disabled';
  }

  override render() {

    const previousClass = this._renderPreviousClass();
    const nextClass = this._renderNextClass();

    return html`
      <ul class="uk-pagination">
          <li class="${previousClass}"><a href="" @click=${this.previous}><span class="uk-margin-small-right" uk-pagination-previous></span> Previous</a></li>
          <li class="uk-active"><span>Page ${this.page}</span></li>
          <li class="uk-margin-auto-left ${nextClass}"><a href="" @click=${this.next}>Next <span class="uk-margin-small-left" uk-pagination-next></span></a></li>
      </ul>
    `;
  }

}


declare global {
  interface HTMLElementTagNameMap {
    'lis-pagination-element': LisPaginationElement;
  }
}