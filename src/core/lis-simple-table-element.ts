import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';


/**
 * A Web Component that provides a generic table element.
 *
 * @slot - Adds content after the content defined via the component properties.
 * Can be used to manually create a table that has the same styling as the
 * component.
 */
@customElement('lis-simple-table-element')
export class LisSimpleTableElement extends LitElement {

  /**
   * @ignore
   */
  // disable shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  /**
   * The caption shown above the table.
   */
  @property({type: String})
  caption: string = '';

  /**
   * An ordered list of attributes in the input data objects used to populate
   * table rows. Assumed to be invariant if assigned as an attribute.
   */
  @property({type: Array<string>})
  dataAttributes: string[] = [];

  /**
   * A single object mapping attributes to header labels. Assumed to be
   * invariant if assigned as an attribute.
   */
  @property({type: Object})
  header: Object = {};

  /**
   * The data to display in the table. Only attributes defined in the
   * `dataAttributes` property will be parsed from the objects.
   */
  // not an attribute because Arrays (i.e. Objects) don't trigger Lit change
  // detection
  @property({type: Array<Object>, attribute: false})
  data: Object[] = [];

  // converts an object to a table row
  private _objectToRow(o: Object, cellTag: string='td') {
    const startTag = `<${cellTag}>`;
    const endTag = `</${cellTag}>`;
    const cells = this.dataAttributes.map((a) => {
      const data = o.hasOwnProperty(a) ? o[a as keyof typeof o] : '';
      const cell = startTag + data + endTag;
      return cell;
    });
    return html`<tr>${unsafeHTML(cells.join(''))}</tr>`;
  }

  // computes the caption part of the component's table
  private _getCaption() {
    if (!this.caption) {
      return html``;
    }
    return html`<caption>${this.caption}</caption>`;
  }

  // computes the header part of the component's table
  private _getHeader() {
    if (!this.header) {
      return html``;
    }
    const row = this._objectToRow(this.header, 'th');
    return html`<thead>${row}</thead>`;
  }

  // computes the rows for the component's table
  private _getBody() {
    if (!this.data) {
      return html``;
    }
    const rows = this.data.map((o) => this._objectToRow(o));
    return html`<tbody>${rows}</tbody>`;
  }

  override render() {

    // compute table parts
    const caption = this._getCaption();
    const header = this._getHeader();
    const body = this._getBody();

    // draw the table
    return html`
      <table class="uk-table uk-table-divider uk-table-small">
        ${caption}
        ${header}
        ${body}
        <slot></slot>
      </table>
    `;
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'lis-simple-table-element': LisSimpleTableElement;
  }
}
