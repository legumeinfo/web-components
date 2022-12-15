import {ReactiveController, ReactiveControllerHost} from 'lit';


/**
 * A controller that allows components to subsribe to the
 * {@link !DOMContentLoaded | `DOMContentLoaded`} event in a manner that
 * triggers changes in the component's template when the event occurs.
 */
export class LisDomContentLoadedController implements ReactiveController {

  /** @ignore */
  host: ReactiveControllerHost;

  /** @ignore */
  private _listeners: EventListener[] = [];

  /**
   * @param host - The controller that's using the controller.
   */
  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
  }

  /** @ignore */
  hostConnected() {
    document.addEventListener('DOMContentLoaded', this._contentLoaded.bind(this));
  }

  /** @ignore */
  hostDisconnected() {
    document.removeEventListener('DOMContentLoaded', this._contentLoaded.bind(this));
  }

  /**
   * Adds a listener to the {@link !DOMContentLoaded | `DOMContentLoaded`} event.
   *
   * @param listener - The listener to subscribe to the
   * {@link !DOMContentLoaded | `DOMContentLoaded`} event.
   */
  addListener(listener: EventListener): void {
    // each listener is called in the scope of the host
    this._listeners.push(listener.bind(this.host));
  }

  /** @ignore */
  // calls all listeners of the DOMContentLoaded event
  private _contentLoaded(event: Event): void {
    // redraw the host
    this.host.requestUpdate();
    // wait for the redraw to complete in case any listeners rely on state from the template
    this.host.updateComplete
      .then(() => {
        // call each listener
        this._listeners.forEach((listener) => {
          listener(event);
        });
      });
  }

}
