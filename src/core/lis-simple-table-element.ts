import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

import {LisSlotController} from '../controllers';
import {StringObjectModel} from '../models';
import {hasOwnProperty} from '../utils';

/**
 * @htmlElement `<lis-simple-table-element>`
 *
 * A Web Component that provides a generic table element.
 *
 * @slot - Adds content after the content defined via the component properties.
 * Can be used to manually create a table that has the same styling as the
 * component.
 *
 * @example
 * The simple table element's
 * {@link caption | `caption`}, {@link dataAttributes | `dataAttributes`}, and
 * {@link header | `header`} attributes/properties can be set via HTML or
 * JavaScript. However, {@link !HTMLElement | `HTMLElement`} properties can only
 * be set via JavaScript, meaning the {@link data | `data`} property can only be
 * set via a `<lis-simple-table-element>` tag's instance of the
 * {@link LisSimpleTableElement | `LisSimpleTableElement`} class. For example:
 * ```html
 * <!-- set the caption, dataAttributes, and header attributes/properties via HTML -->
 * <lis-simple-table-element
 *   caption="My cheesy table"
 *   dataAttributes="['cheese', 'region']"
 *   header="{cheese: 'Cheese', region: 'Region'}">
 * </lis-simple-table-element>
 *
 * <!-- set all attributes/properties via JavaScript -->
 * <lis-simple-table-element id="table"></lis-simple-table-element>
 * <script type="text/javascript">
 *   // get the simple table element
 *   const tableElement = document.getElementById('table');
 *   // set the element's properties
 *   tableElement.caption = 'My cheesy table';
 *   tableElement.dataAttributes = ['cheese', 'region'];
 *   tableElement.header = {cheese: 'Cheese', region: 'Region'};
 *   tableElement.data = [
 *     {cheese: 'Brie', region: 'France'},
 *     {cheese: 'Burrata', region: 'Italy'},
 *     {cheese: 'Feta', region: 'Greece'},
 *     {cheese: 'Gouda', region: 'Netherlands'},
 *   ];
 * </script>
 * ```
 *
 * @example
 * Alternatively, a simple table's contents can be written in HTML using the element's
 * slot. This content must be wrapped in a `<template>` tag so the Web Browser
 * doesn't strip the tags as invalid since they occur outside of actual `<table>` tags.
 * Note that this will override any content assigned via JavaScript:
 * ```html
 * <!-- set the caption, dataAttributes, and header attributes/properties via HTML -->
 * <!-- NOTE: this is the table produced by the previous example -->
 * <lis-simple-table-element>
 *   <template>
 *     <caption>My cheesy table</caption>
 *     <thead>
 *       <tr>
 *         <th>Cheese</th>
 *         <th>Region</th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr>
 *         <td>Brie</td>
 *         <td>France</td>
 *       </tr>
 *       <tr>
 *         <td>Burrata</td>
 *         <td>Italy</td>
 *       </tr>
 *       <tr>
 *         <td>Feta</td>
 *         <td>Greece</td>
 *       </tr>
 *       <tr>
 *         <td>Gouda</td>
 *         <td>Netherlands</td>
 *       </tr>
 *     </tbody>
 *   </template>
 * </lis-simple-table-element>
 * ```
 */
@customElement('lis-simple-table-element')
export class LisSimpleTableElement extends LitElement {
  /** @ignore */
  // used by Lit to style the Shadow DOM
  // not necessary but exclusion breaks TypeDoc
  static override styles = css``;

  /** @ignore */
  // disable Shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  protected defaultSlotRef: Ref<HTMLSlotElement> = createRef();

  // a controller the preserves slot functionality when the Shadow DOM is disabled
  protected slotController: LisSlotController;

  /**
   * The caption shown above the table.
   *
   * @attribute
   */
  @property({type: String})
  caption: string = '';

  /**
   * An ordered list of attributes in the input data objects used to populate
   * table rows. Assumed to be invariant if assigned as an attribute.
   *
   * @attribute
   */
  @property({type: Array<string>})
  dataAttributes: Array<string> = [];

  /**
   * A single object mapping attributes to header labels. Assumed to be
   * invariant if assigned as an attribute.
   *
   * @attribute
   */
  @property({type: Object})
  header: StringObjectModel = {};

  /**
   * A single object mapping attributes to table column classes. Assumed to be
   * invariant if assigned as an attribute.
   *
   * @attribute
   */
  @property({type: Object})
  columnClasses: StringObjectModel = {};

  /**
   * The data to display in the table. Only attributes defined in the
   * {@link dataAttributes | `dataAttributes`} property will be parsed from the
   * objects.
   */
  // not an attribute because Arrays (i.e. Objects) don't trigger Lit change
  // detection
  @property({type: Array<object>, attribute: false})
  data: Array<StringObjectModel> = [];

  constructor() {
    super();
    this.slotController = new LisSlotController(this, this.defaultSlotRef);
  }

  /** @ignore */
  // converts an object to a table row
  private _objectToRow(
    o: StringObjectModel,
    cellTag: string = 'td',
    classes: StringObjectModel = {},
  ) {
    const startTag = (cls: string) =>
      cls ? `<${cellTag} class="${cls}">` : `<${cellTag}>`;
    const endTag = `</${cellTag}>`;
    const cells = this.dataAttributes.map((a) => {
      const cls = hasOwnProperty(classes, a) ? classes[a] : '';
      const data = hasOwnProperty(o, a) ? o[a] : '';
      const cell = startTag(cls) + data + endTag;
      return cell;
    });
    return html`<tr>
      ${unsafeHTML(cells.join(''))}
    </tr>`;
  }

  /** @ignore */
  // computes the caption part of the component's table
  private _getCaption() {
    if (!this.caption) {
      return html``;
    }
    return html`<caption>
      ${this.caption}
    </caption>`;
  }

  /** @ignore */
  // computes the header part of the component's table
  private _getHeader() {
    if (!this.header) {
      return html``;
    }
    const row = this._objectToRow(this.header, 'th');
    return html`<thead>
      ${row}
    </thead>`;
  }

  /** @ignore */
  // computes the rows for the component's table
  private _getBody() {
    if (!this.data) {
      return html``;
    }
    const rows = this.data.map((o) => this._objectToRow(o));
    return html`<tbody>
      ${rows}
    </tbody>`;
  }

  /** @ignore */
  // used by Lit to draw the template
  override render() {
    // compute table parts
    const caption = this._getCaption();
    const header = this._getHeader();
    const body = this._getBody();

    // draw the table
    return html`
      <table
        class="uk-table uk-table-divider uk-table-small"
        ${ref(this.defaultSlotRef)}
      >
        ${caption} ${header} ${body}
      </table>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-simple-table-element': LisSimpleTableElement;
  }
}
