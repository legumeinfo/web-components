import {LitElement, html, css} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

import {LisCancelPromiseController} from './controllers';
import {LisSimpleTableElement} from './core';
import {AlertModifierModel} from './models';


/**
 * A single result of a linkout performed by the
 * {@link LisLinkoutElement | `LisLinkoutElement`} class.
 */
export type LinkoutResult = {
  href: string;
  text: string;
};


/**
 * The type of object the {@link LisLinkoutElement | `LisLinkoutElement`} expects back
 * from the linkout function.
 */
export type LinkoutResults = {
  results: LinkoutResult[];
};


/**
 * Optional parameters that may be given to the linkout function. The
 * {@link !AbortSignal | `AbortSignal`} instance will emit if a linkout is performed
 * before the current linkout completes. This signal should be used to cancel in-flight
 * requests if the linkout API supports it.
 */
export type LinkoutOptions = {abortSignal?: AbortSignal};


/**
 * The signature of the function of the
 * {@link LisLinkoutElement | `LisLinkoutElement`} class required for
 * performing a linkout.
 *
 * @typeParam LinkoutData - The type of the linkout function `linkoutData` parameter.
 *
 * @param linkoutData The data to give to the linkout function.
 * @param options Optional parameters that aren't required to perform a linkout but may
 * be useful.
 *
 * @returns A {@link !Promise | `Promise`} that resolves to a
 * {@link LinkoutResults | `LinkoutResults`} object.
 */
export type LinkoutFunction<LinkoutData> =
  (linkoutData: LinkoutData, options: LinkoutOptions) =>
    Promise<LinkoutResults>;


/**
 * @htmlElement `<lis-linkout-element>`
 *
 * A Web Component that provides an interface for performing linkout queries against an
 * a linkout service. 
 * The returned links are displayed in a table.
 *
 * @example
 * {@link !HTMLElement | `HTMLElement`} properties can only be set via
 * JavaScript. This means the {@link linkoutFunction | `LinkoutFunction`} property
 * must be set on a `<lis-linkout-element>` tag's instance of the
 * {@link LisLinkoutElement | `LisLinkoutElement`} class. For example:
 * ```html
 *    <lis-linkout-element id="linkouts"></lis-linkout-element>
 *
 *    <!-- configure the Web Component via JavaScript -->
 *    <script type="text/javascript">
 *      // a site-specific function that sends a request to a linkout API
 *      function getGeneLinkouts(genes) {
 *        // returns a Promise that resolves to a linkout results object
 *      }
 *      // get the linkout element
 *      const linkoutElement = document.getElementById('linkouts');
 *      // set the element's linkoutFunction property
 *      linkoutElement.linkoutFunction = getGeneLinkouts;
 *      // get linkouts when the page is finished loading
 *      window.onload = (event) => {
 *        linkoutElement.getLinkouts(['cicar.CDCFrontier.gnm3.ann1.Ca1g000600']);
 *      }
 *   </script>
 * ```
 */
@customElement('lis-linkout-element')
export class LisLinkoutElement extends LitElement {

  // a controller that allows in-flight linkouts to be cancelled
  protected cancelPromiseController = new LisCancelPromiseController(this);

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
   * The query string for the linkout service.
   * Reflect is true so that the attribute will trigger
   * when set with JS
   *
   * @attribute
   */
  @property({type: String, reflect: true})
  queryString: string = '';

  /**
   * The service to use from the linkout service. default: gene_linkouts
   *
   * @attribute
   */
  @property({type: String})
  service: string = 'gene_linkouts';

  // the linkout callback function; not an attribute because functions can't be
  // parsed from attributes
  @property({type: Function, attribute: false})
  linkoutFunction: LinkoutFunction<unknown> =
    () => Promise.reject(new Error('No linkout function provided'));

  // messages sent to the user about search status
  @state()
  private _alertMessage: string = '';

  // the style of the alert element
  @state()
  private _alertModifier: AlertModifierModel = 'primary';

  // bind to the table element in the template
  @query('lis-simple-table-element')
  private _table!: LisSimpleTableElement;

  /**
   * Gets linkouts for the given data.
   *
   * @typeParam LinkoutData - Should match the type of the linkout function `linkoutData`
   * parameter.
   *
   * @param data - The data to get linkouts for.
   */
  public getLinkouts<LinkoutData>(data: LinkoutData): void {
    this._table.data = [];
    const message = `<span uk-spinner></span> Loading linkouts`;
    this._setAlert(message, 'primary');
    this.cancelPromiseController.cancel();
    const options = {abortSignal: this.cancelPromiseController.abortSignal};
    const linkoutPromise = this.linkoutFunction(data, options);
    this.cancelPromiseController.wrapPromise(linkoutPromise)
      .then(
        (results: LinkoutResults) => this._linkoutSuccess(results),
        (error: Error) => {
          // do nothing if the request was aborted
          if ((error as any).type !== 'abort') {
            this._linkoutFailure(error);
          }
        },
      );
  }

  /** @ignore */
  // updates the table and alert with the search result data
  private _linkoutSuccess(linkoutResults: LinkoutResults): void {
    // destruct the linkout result
    const {results} = linkoutResults;
    // report the success in the alert
    const plural = results.length == 1 ? '' : 's';
    const message = `${results.length} link${plural} loaded`;
    const modifier = results.length ? 'success' : 'warning';
    this._setAlert(message, modifier);
    // display the results in the table
    const data = results.map((result: LinkoutResult) => {
      return {linkout: `<a href="${result.href}">${result.text}.</a>`};
    });
    this._table.data = data;
  }

  /** @ignore */
  // updates the alert with an error message and throws the actual error so it will
  // appear in the console/debugger
  private _linkoutFailure(error: Error): void {
    const message = 'Linkout failed';
    this._setAlert(message, 'danger');
    throw error;
  }

  /** @ignore */
  // sets the alert element style and content
  private _setAlert(message: string, modifier: AlertModifierModel): void {
    this._alertMessage = message;
    this._alertModifier = modifier;
  }

  /** @ignore */
  // used by Lit to draw the template
  override render() {

    // compute table parts
    const dataAttributes = ['linkout']
    const header = {'linkout': 'Linkouts'};

    // draw the table
    return html`
      <div class="uk-alert uk-alert-${this._alertModifier}">
        <p>${unsafeHTML(this._alertMessage)}</p>
      </div>
      <lis-simple-table-element
        caption=""
        .dataAttributes=${dataAttributes}
        .header=${header}>
      </lis-simple-table-element>
    `;
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'lis-linkout-element': LisLinkoutElement;
  }
}
