import {LitElement, ReactiveController, ReactiveControllerHost} from 'lit';
import {Ref} from 'lit/directives/ref.js';


/**
 * A controller that allows components to use the `<slot>` tag when their Shadow DOM
 * is disabled.
 *
 * Limitations include all slot content must be wrapped in an element, e.g. text must be
 * in a `<span>` tag, and elements that Web Browsers will remove if not inside the
 * correct tag must be wrapped in a `<template>` tag, e.g. table rows. The content of a
 * `<template>` tag must also be wrapped in an element.
 *
 * @example
 * In addition the typical `host` parameter, the controller constructor takes references
 * for all the slots it should control.
 *
 * ```typescript
 * import {LitElement, html} from 'lit';
 * import {Ref, createRef, ref} from 'lit/directives/ref.js';
 *
 * @customElement('element-with-slot')
 * export class ElementWithSlots extends LitElement {
 *
 *   // disable the Shadow DOM
 *   override createRenderRoot() {
 *     return this;
 *   }
 *
 *   // the slot controller
 *   protected slotController: LisSlotController;
 *
 *   // slot references for the controller
 *   protected defaultSlotRef: Ref<HTMLSlotElement> = createRef();
 *   protected namedSlotRef: Ref<HTMLSlotElement> = createRef();
 *
 *   constructor() {
 *     super();
 *     // instantiate the controller with the references
 *     this.slotController = new LisSlotController(this, this.defaultSlotRef, this.namedSlotRef);
 *   }
 *
 *   override render() {
 *     return html`
 *     <slot ${ref(this.defaultSlotRef)}>default slot content</slot>
 *     <slot name="named-slot" ${ref(this.namedSlotRef)}>default named slot content</slot>
 *     `;
 *   }
 *
 * }
 * ```
 * The above element can be used as follows:
 * ```html
 * <element-with-slots>
 *   <template>
 *     <span>This will be placed in the unnamed slot and replace its default content</span>
 *   </template>
 *   <span slot="named-slot">This will be placed in the named slot and replace its default content</span>
 * </element-with-slots>
 * ```
 */
export class LisSlotController implements ReactiveController {

  /** @ignore */
  host: LitElement & ReactiveControllerHost;

  protected _children: Element[] = [];
  protected _slotRefs: Ref<HTMLSlotElement>[];

  /**
   * @param host - The controller that's using the controller.
   * @param ...slotRefs - References to the elements the controller should load data for.
   */
  constructor(host: LitElement & ReactiveControllerHost, ...slotRefs: Ref<HTMLSlotElement>[]) {
    (this.host = host).addController(this);
    this._slotRefs = slotRefs;
  }

  /** @ignore */
  hostUpdate() {
    // get the host children before its template is added
    this._children = Array.from(this.host.children);
  }

  /** @ignore */
  hostUpdated() {
    // for each slot
    this._slotRefs.forEach((ref) => {
      if (ref.value === undefined) {
        return;
      }
      // get the slot's name
      const name: string | null = ref.value.getAttribute('name');
      // make a list of elements that belong in the slot
      const slotChildren =
        this._children
          // only keep elements for this specific slot
          .filter((element) => element.getAttribute('slot') === name)
          // unpack template children
          .map((element) => {
            if (element instanceof HTMLTemplateElement) {
              return Array.from(element.children);
            }
            return element;
          })
          // flatten into an array of elements only
          .flat();
      // put the children in the slot
      if (slotChildren.length > 0) {
        // children only need to be moved once; trying again will throw an error
        try {
          //ref.value.assign(...slotChildren);  // renders via Shadow DOM
          ref.value.replaceChildren(...slotChildren);  // fakes Shadow DOM by moving children
        } catch(error) { }
      }
    });
  }

}
