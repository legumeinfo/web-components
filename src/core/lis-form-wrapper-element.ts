import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';


@customElement('lis-form-wrapper-element')
export class LisFormWrapperElement extends LitElement {

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
