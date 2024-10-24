import {LitElement, html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

/**
 * @htmlElement `<lis-inline-loading-element>`
 *
 * A Web Component that provides a consistent inline loading element. When in the
 * loading state, the element shows a spinner. When a search succeeds, the spinner
 * is hidden. When no results are returned or an error occurs, an alert icon is
 * shown. Optionally, a tooltip may be shown with every icon with a context-specific
 * message.
 *
 * @example
 * By default, the loading element is not visible. It should be interacted with via
 * JavaScript:
 * ```html
 * <!-- the loading element -->
 * <lis-inline-loading-element id="loading"></lis-inline-alert-element>
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
 * By default, the loading element uses "data" in its tooltip messages, e.g. "No data
 * loaded". This can be override using the {@link dataType | `dataType`}
 * attribute/property:
 * ```html
 * <!-- set the dataType attributes via HTML -->
 * <lis-inline-loading-element id="loading" dataType="special sauce"></lis-inline-loading-element>
 *
 * <!-- set the dataType property via JavaScript
 * <script type="text/javascript">
 *   // get the loading element
 *   const loadingElement = document.getElementById('loading');
 *   // set the element's dataTypeproperty
 *   loadingElement.dataType = 'secret sauce';
 * </script>
 * ```
 */
@customElement('lis-inline-loading-element')
export class LisInlineLoadingElement extends LitElement {
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
  state: 'loaded' | 'loading' | 'error' | 'info' = 'loaded';

  @state()
  content: string = 'loaded';

  public loading() {
    this.content = '';
    this.state = 'loading';
  }

  public success() {
    this.content = '';
    this.state = 'loaded';
  }

  public noResults() {
    this.content = `No ${this.dataType} found`;
    this.state = 'info';
  }

  public failure() {
    this.content = `Failed to load ${this.dataType}`;
    this.state = 'error';
  }

  public error(content: string) {
    this.content = content;
    this.state = 'info';
  }

  /** @ignore */
  // used by Lit to draw the template
  override render() {
    if (this.state == 'loaded') return html``;
    if (this.state == 'error' || this.state == 'info') {
      const icon = this.state == 'error' ? 'warning' : 'info';
      return html`<span uk-icon="${icon}" uk-tooltip="${this.content}"></span>`;
    }
    return html`<span uk-spinner></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-inline-loading-element': LisInlineLoadingElement;
  }
}
