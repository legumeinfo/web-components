import {ReactiveController, ReactiveControllerHost} from 'lit';


export class LisQueryStringParametersController implements ReactiveController {

  host: ReactiveControllerHost;

  private _listeners: EventListener[] = [];

  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
  }

  hostConnected() {
    window.addEventListener('popstate', this._popState.bind(this));
  }

  hostDisconnected() {
    window.removeEventListener('popstate', this._popState.bind(this));
  }

  // returns the current value of a URL parameter
  getParameter(name: string, defaultValue: string = ''): string {
    const params = new URLSearchParams(window.location.search);
    const value: string | null = params.get(name);
    if (value !== null) {
      return value;
    }
    return defaultValue;
  }

  // updates the URL parameters
  setParameters(parameters: Object): void {
    // don't update the query string if there's nothing to update
    if (!this._differentValues(parameters)) {
      return;
    }
    // push the new params onto the browser's history stack
    const queryString = '?' +
      Object.entries(parameters)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
    history.pushState(parameters, '', queryString);
  }

  // adds a listener to the popstate event
  addListener(listener: EventListener): void {
    // each listener is called in the scope of the host
    this._listeners.push(listener.bind(this.host));
  }

  // determines if any of the given parameters have different values than the URL parameters
  private _differentValues(parameters: Object): boolean {
    const params = new URLSearchParams(window.location.search);
    return Object.entries(parameters)
      .some(([key, value]) => value.toString() !== params.get(key));
  }

  // calls all listeners of the popstate event
  private _popState(event: PopStateEvent): void {
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
