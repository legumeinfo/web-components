import {LitElement, html} from 'lit';
import {customElement, queryAssignedElements} from 'lit/decorators.js';


@customElement('lis-form-wrapper-element')
export class LisFormWrapperElement extends LitElement {

  // bind to the forms in the slot
  @queryAssignedElements({selector: 'form'})
  private _forms!: HTMLFormElement[];

  // allows the wrapped form to be submitted programmatically
  submit() {
    // throw an error if there's no form to submit
    if (!this._forms.length) {
      throw new Error('No form to submit');
    }
    // only submit the first form
    const formElement = this._forms[0];
    // get the form's submit element
    const submitElement: HTMLElement | null = formElement.querySelector('[type="submit"]');
    // use the element to submit the form if it exists
    if (submitElement !== null) {
      formElement.requestSubmit(submitElement);
    // otherwise, use the form as the submit element
    } else {
      formElement.requestSubmit();
    }
  }

  // called when the form in the template slot is submitted
  private _submit(e: Event) {
    // stop the submit event
    e.preventDefault();
    e.stopPropagation();
    // parse the values from the form
    const data = new FormData(e.target as HTMLFormElement);
    // dispatch a custom event
    const options = {
      detail: {data},
      bubbles: true,
      composed: true
    };
    this.dispatchEvent(new CustomEvent('submit', options));
  }

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
