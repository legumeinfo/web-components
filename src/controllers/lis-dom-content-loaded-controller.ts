import {ReactiveController, ReactiveControllerHost} from 'lit';


export class LisDomContentLoadedController implements ReactiveController {

  host: ReactiveControllerHost;

  private _listeners: EventListener[] = [];

  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
  }

  hostConnected() {
    document.addEventListener('DOMContentLoaded', this._contentLoaded.bind(this));
  }

  hostDisconnected() {
    document.removeEventListener('DOMContentLoaded', this._contentLoaded.bind(this));
  }

  // adds a listener to the DOMContentLoaded event
  addListener(listener: EventListener): void {
    // each listener is called in the scope of the host
    this._listeners.push(listener.bind(this.host));
  }

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
