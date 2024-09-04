import {LitElement, css, html} from 'lit';
import {customElement, queryAssignedElements} from 'lit/decorators.js';

/**
 * @htmlElement `<lis-form-wrapper-element>`
 *
 * A Web Component that provides boilerplate functionality for the form it wraps,
 * i.e. the form in its slot.
 *
 * @example
 * As the name suggests, the component should enclose a form. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-form-wrapper-element>
 *   <fieldset class="uk-fieldset">
 *     <legend class="uk-legend">Legend</legend>
 *     <div class="uk-margin">
 *       <input class="uk-input" type="text" placeholder="Input" aria-label="Input">
 *     </div>
 *     <div class="uk-margin">
 *       <select class="uk-select" aria-label="Select">
 *         <option>Option 01</option>
 *         <option>Option 02</option>
 *       </select>
 *     </div>
 *     <div class="uk-margin">
 *       <textarea class="uk-textarea" rows="5" placeholder="Textarea" aria-label="Textarea"></textarea>
 *     </div>
 *     <div class="uk-margin uk-grid-small uk-child-width-auto uk-grid">
 *       <label><input class="uk-radio" type="radio" name="radio2" checked> A</label>
 *       <label><input class="uk-radio" type="radio" name="radio2"> B</label>
 *     </div>
 *     <div class="uk-margin uk-grid-small uk-child-width-auto uk-grid">
 *       <label><input class="uk-checkbox" type="checkbox" checked> A</label>
 *       <label><input class="uk-checkbox" type="checkbox"> B</label>
 *     </div>
 *     <div class="uk-margin">
 *       <input class="uk-range" type="range" value="2" min="0" max="10" step="0.1" aria-label="Range">
 *     </div>
 *   </fieldset>
 *   <div class="uk-margin">
 *     <button type="submit" class="uk-button uk-button-primary">Search</button>
 *   </div>
 * </lis-form-wrapper-element>
 * ```
 */
@customElement('lis-form-wrapper-element')
export class LisFormWrapperElement extends LitElement {
  /** @ignore */
  // used by Lit to style the Shadow DOM
  // not necessary but exclusion breaks TypeDoc
  static override styles = css``;

  /**
   * Fired when the wrapped form is submitted. Dispatches a
   * {@link !CustomEvent | `CustomEvent`} containing a
   * {@link !FormData | `FormData`} instance with the values of the elements in
   * the wrapped form.
   * @eventProperty
   */
  static readonly submit: CustomEvent<{data: FormData}>;

  /** @ignore */
  // bind to the forms in the slot
  @queryAssignedElements({selector: 'form'})
  private _forms!: HTMLFormElement[];

  /**
   * Allows the wrapped form to be submitted programmatically.
   */
  submit() {
    // throw an error if there's no form to submit
    if (!this._forms.length) {
      throw new Error('No form to submit');
    }
    // only submit the first form
    const formElement = this._forms[0];
    // get the form's submit element
    const submitElement: HTMLElement | null =
      formElement.querySelector('[type="submit"]');
    // use the element to submit the form if it exists
    if (submitElement !== null) {
      formElement.requestSubmit(submitElement);
      // otherwise, use the form as the submit element
    } else {
      formElement.requestSubmit();
    }
  }

  /** @ignore */
  // called when the form in the template slot is submitted
  private _submit(e: Event) {
    // stop the submit event
    e.preventDefault();
    e.stopPropagation();
    // parse the values from the form
    const formData = new FormData(e.target as HTMLFormElement);
    // dispatch a custom event
    const options = {
      detail: {formData, formEvent: e},
      bubbles: true,
      composed: true,
    };
    this.dispatchEvent(new CustomEvent('submit', options));
  }

  /** @ignore */
  // the template
  override render() {
    return html`<slot @submit="${this._submit}"></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-form-wrapper-element': LisFormWrapperElement;
  }
}
