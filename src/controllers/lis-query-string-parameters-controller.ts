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

  getParameter(name: string, defaultValue: string = ''): string {
    const params = new URLSearchParams(window.location.search);
    const value: string | null = params.get(name);
    if (value !== null) {
      return value;
    }
    return defaultValue;
  }

  setParameters(parameters: Object): void {
    const queryString = '?' +
      Object.entries(parameters)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
    history.pushState(parameters, '', queryString);
  }

  addListener(listener: EventListener): void {
    this._listeners.push(listener.bind(this.host));
  }

  private _popState(event: PopStateEvent): void {
    this._listeners.forEach((listener) => {
      listener(event);
    });
  }

}
