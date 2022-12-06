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

  addListener(listener: EventListener): void {
    this._listeners.push(listener.bind(this.host));
  }

  private _contentLoaded(event: Event): void {
    this._listeners.forEach((listener) => {
      listener(event);
    });
  }

}
