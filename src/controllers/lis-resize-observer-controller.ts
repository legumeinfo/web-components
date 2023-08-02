import {ReactiveController, ReactiveControllerHost} from 'lit';


/**
 * The signature of the callback function required when initializing the controller.
 *
 * @param entries - An array of entries that can be used to access the new dimensions of
 * observed elements.
 */
export type CallbackFunction = (entries: ResizeObserverEntry[]) => void;


/**
 * A controller that wraps the {@link !ResizeObserver | `ResizeObserver`}, allowing
 * components to subscribe to the events in a manner that triggers changes in the
 * component's template when the event occurs.
 */
export class LisResizeObserverController implements ReactiveController {

  /** @ignore */
  host: ReactiveControllerHost;

  /** @ignore */
  private _resizeObserver: ResizeObserver;

  /**
   * @param host - The component that's using the controller.
   * @param callback - A function to call in the host's scope when a resize event occurs.
   */
  constructor(host: ReactiveControllerHost, callback: CallbackFunction) {
    (this.host = host).addController(this);
    this._resizeObserver = new ResizeObserver(callback.bind(host));
  }

  /** @ignore */
  hostDisconnected() {
    // unobserve all observed elements
    this._resizeObserver.disconnect();
  }

  /**
   * Observes the given element.
   *
   * @param element - The element to be observed.
   */
  observe(element: HTMLElement): void {
    this._resizeObserver.observe(element);
  }

  /**
   * Stops observing the given element.
   *
   * @param element - The element to stop observing.
   */
  unobserve(element: HTMLElement): void {
    this._resizeObserver.unobserve(element);
  }

}