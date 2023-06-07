import {ReactiveController, ReactiveControllerHost} from 'lit';


/**
 * A controller that allows components to interact with URL query string
 * parameters in a manner that triggers changes in the component's template when
 * parameter values change.
 */
export class LisQueryStringParametersController implements ReactiveController {

  /** @ignore */
  host: ReactiveControllerHost;

  /** @ignore */
  private _preUpdateListeners: EventListener[] = [];

  /** @ignore */
  private _listeners: EventListener[] = [];

  /**
   * @param host - The component that's using the controller.
   */
  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
  }

  /** @ignore */
  hostConnected() {
    window.addEventListener('popstate', this._popState.bind(this));
  }

  /** @ignore */
  hostDisconnected() {
    window.removeEventListener('popstate', this._popState.bind(this));
  }

  /**
   * Gets the value of a URL query string parameter. This is reactive when used
   * inside a component template.
   *
   * @param name - The name of the parameter to get the value of.
   * @param defaultValue - The default value to return if the parameter isn't
   * in the query string.
   *
   * @returns The value of the parameter or the default value provided.
   */
  getParameter(name: string, defaultValue: string = ''): string {
    const params = new URLSearchParams(window.location.search);
    const value: string | null = params.get(name);
    if (value !== null) {
      return value;
    }
    return defaultValue;
  }

  /**
   * Updates the URL query string parameters.
   *
   * @param parameters - An object mapping parameter names to the values to
   * assign them.
   */
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

  /**
   * Adds a listener to the {@link !popstate | `'popstate'`} event that will be executed
   * before the host's DOM is updated.
   *
   * @param listener - The listener to subscribe to the event.
   */
  addPreUpdateListener(listener: EventListener): void {
    // each listener is called in the scope of the host
    this._preUpdateListeners.push(listener.bind(this.host));
  }

  /**
   * Adds a listener to the {@link !popstate | `'popstate'`} event that will be executed
   * after the host's DOM is updated.
   *
   * @param listener - The listener to subscribe to the event.
   */
  addListener(listener: EventListener): void {
    // each listener is called in the scope of the host
    this._listeners.push(listener.bind(this.host));
  }

  /** @ignore */
  // determines if any of the given parameters have different values than the URL parameters
  private _differentValues(parameters: Object): boolean {
    const params = new URLSearchParams(window.location.search);
    return Object.entries(parameters)
      .some(([key, value]) => value.toString() !== params.get(key));
  }

  /** @ignore */
  // calls all listeners of the popstate event
  private _popState(event: PopStateEvent): void {
    // call each pre update listener
    this._preUpdateListeners.forEach((listener) => {
      listener(event);
    });
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
