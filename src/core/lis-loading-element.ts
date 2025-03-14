import {LitElement, html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {LisAlertElement} from './lis-alert-element.js';

/**
 * @htmlElement `<lis-loading-element>`
 *
 * A Web Component that provides a consistent loading element. When in the loading state,
 * the element shows a spinner that covers all content inside of its parent element.
 * When a search succeeds, the spinner is hidden. When no results are returned or an
 * error occurs, an alert element is shown that reports the state of the search.
 *
 * @example
 * By default, the loading element is not visible. It should be interacted with via
 * JavaScript:
 * ```html
 * <!-- the loading element -->
 * <lis-loading-element id="loading"></lis-alert-element>
 *
 * <!-- interact with the element JavaScript -->
 * <script type="text/javascript">
 *   // get the loading element
 *   const loadingElement = document.getElementById('loading');
 *   // activate the spinner overlay
 *   loadingElement.loading();
 *   // hide the spinner overlay / reset the element
 *   loadingElement.success();
 *   // show an alert that no results were returned
 *   loadingElement.noResults();
 *   // show an alert that reports an error
 *   loadingElement.failure();
 * </script>
 * ```
 *
 * @example
 * By default, the loading element uses "data" in its alert messages, e.g. "No data
 * loaded". This can be override using the {@link dataType | `dataType`}
 * attribute/property:
 * ```html
 * <!-- set the dataType attributes via HTML -->
 * <lis-loading-element id="loading" dataType="special sauce"></lis-loading-element>
 *
 * <!-- set the dataType property via JavaScript
 * <script type="text/javascript">
 *   // get the loading element
 *   const loadingElement = document.getElementById('loading');
 *   // set the element's dataTypeproperty
 *   loadingElement.dataType = 'secret sauce';
 * </script>
 * ```
 *
 * @example
 * Depending on the type of parent element, the spinner overlay may cover an ancestor
 * of the parent instead. Use the `uk-inline` class on the parent to force the overlay
 * to cover the loading element's parent:
 * ```html
 * <!-- force the loading overlay to cover its parent element -->
 * <div class="uk-inline">
 *   <lis-loading-element></lis-loading-element>
 * </div>
 * ```
 */
@customElement('lis-loading-element')
export class LisLoadingElement extends LitElement {
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
   * The type of data being loaded.
   *
   * @attribute
   */
  @property({type: String})
  dataType: string = 'data';

  // The current state of the element, i.e. what UI elements should be visible.
  @state()
  state: 'loading' | 'loaded' | 'message' = 'loaded';

  // bind to the alert element in the template
  private _alertRef: Ref<LisAlertElement> = createRef();

  public loading() {
    this.state = 'loading';
  }

  public success() {
    this.state = 'loaded';
  }

  public noResults() {
    const content = `No ${this.dataType} found`;
    this._alertRef.value?.warning(content);
    this.state = 'message';
  }

  public failure() {
    const content = `Failed to load ${this.dataType}`;
    this._alertRef.value?.danger(content);
    this.state = 'message';
  }

  public error(content: string) {
    this._alertRef.value?.warning(content);
    this.state = 'message';
  }

  /** @ignore */
  // used by Lit to draw the template
  override render() {
    return html`
      <div
        class="uk-overlay-default uk-position-cover uk-flex uk-flex-center uk-flex-middle"
        ?hidden=${this.state != 'loading'}
      >
        <span uk-spinner></span>
      </div>
      <lis-alert-element
        ${ref(this._alertRef)}
        ?hidden=${this.state != 'message'}
      ></lis-alert-element>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-loading-element': LisLoadingElement;
  }
}
