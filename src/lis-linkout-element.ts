import {LitElement, html, css} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {LisCancelPromiseController} from './controllers';
import {LisLoadingElement, LisSimpleTableElement} from './core';

/**
 * A single result of a linkout performed by the
 * {@link LisLinkoutElement | `LisLinkoutElement`} class.
 */
export type LisLinkoutResult = {
  href: string;
  text: string;
};

/**
 * The type of object the {@link LisLinkoutElement | `LisLinkoutElement`} expects back
 * from the linkout function.
 */
export type LisLinkoutResults = {
  results: LisLinkoutResult[];
};

/**
 * Optional parameters that may be given to the linkout function. The
 * {@link !AbortSignal | `AbortSignal`} instance will emit if a linkout is performed
 * before the current linkout completes. This signal should be used to cancel in-flight
 * requests if the linkout API supports it.
 */
export type LisLinkoutOptions = {abortSignal?: AbortSignal};

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
 * {@link LisLinkoutResults | `LisLinkoutResults`} object.
 */
export type LisLinkoutFunction<LinkoutData> = (
  linkoutData: LinkoutData,
  options: LisLinkoutOptions,
) => Promise<LisLinkoutResults>;

/**
 * @htmlElement `<lis-linkout-element>`
 *
 * A Web Component that provides an interface for performing linkout queries against an
 * a linkout service.
 * The returned links are displayed in a table.
 *
 * @example
 * {@link !HTMLElement | `HTMLElement`} properties can only be set via
 * JavaScript. This means the {@link linkoutFunction | `linkoutFunction`} property
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

  // the linkout callback function; not an attribute because functions can't be
  // parsed from attributes
  @property({type: Function, attribute: false})
  linkoutFunction: LisLinkoutFunction<unknown> = () =>
    Promise.reject(new Error('No linkout function provided'));

  // bind to the table element in the template
  @query('lis-simple-table-element')
  private _table!: LisSimpleTableElement;

  // bind to the loading element in the template
  private _loadingRef: Ref<LisLoadingElement> = createRef();

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
    this._loadingRef.value?.loading();
    this.cancelPromiseController.cancel();
    const options = {abortSignal: this.cancelPromiseController.abortSignal};
    const linkoutPromise = this.linkoutFunction(data, options);
    this.cancelPromiseController.wrapPromise(linkoutPromise).then(
      (results: LisLinkoutResults) => this._linkoutSuccess(results),
      (error: Error | Event) => {
        // do nothing if the request was aborted
        if (!(error instanceof Event && error.type === 'abort')) {
          this._loadingRef.value?.failure();
          throw error;
        }
      },
    );
  }

  /** @ignore */
  // updates the table and loading element with the search result data
  private _linkoutSuccess(linkoutResults: LisLinkoutResults): void {
    // destruct the linkout result
    const {results} = linkoutResults;
    // update the loading element accordingly
    if (results.length) {
      this._loadingRef.value?.success();
    } else {
      this._loadingRef.value?.noResults();
    }
    // display the results in the table
    const data = results.map((result: LisLinkoutResult) => {
      return {linkout: `<a href="${result.href}">${result.text}.</a>`};
    });
    this._table.data = data;
  }

  /** @ignore */
  // used by Lit to draw the template
  override render() {
    // compute table parts
    const dataAttributes = ['linkout'];
    const header = {linkout: 'Linkouts'};

    // draw the table
    return html`
      <div class="uk-inline uk-width-1-1">
        <lis-loading-element ${ref(this._loadingRef)}></lis-loading-element>
        <lis-simple-table-element
          caption=""
          .dataAttributes=${dataAttributes}
          .header=${header}
        >
        </lis-simple-table-element>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-linkout-element': LisLinkoutElement;
  }
}
