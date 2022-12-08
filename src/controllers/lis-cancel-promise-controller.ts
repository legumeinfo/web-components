import {ReactiveController, ReactiveControllerHost} from 'lit';


type CancelState = {abortSignal: AbortSignal; wrapCount: Number; promise?: Promise<void>};


// A controller that allows Promises to be cancelled.
// NOTE: All Promises made cancellable with this controller are cancelled with
// the same AbortSignal. Multiple instances of the controller should be used
// if multiple signals are desired.
export class LisCancelPromiseController implements ReactiveController {

  host: ReactiveControllerHost;

  // @ts-ignore
  private _abortController: AbortController;
  // @ts-ignore
  abortSignal: AbortSignal;

  // wrap state with promise to avoid race conditions
  // @ts-ignore
  private _cancelState: CancelState;

  private _listeners: EventListener[] = [];

  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
    // members ignored because they're not definitely assigned in the constructor
    this._initialize();
  }

  hostConnected() {
    this._addEventListener();
  }

  hostDisconnected() {
    this.abortSignal.removeEventListener('abort', this._aborted.bind(this));
  }

  // makes a Promise cancellable by racing it against a Promise that only cancels
  wrapPromise<T>(promise: Promise<T>): Promise<T> {
    // create a Promise race that will reject when the abort signal emits
    const cancelState = this._cancelState;
    // @ts-ignore
    cancelState.wrapCount += 1;
    return Promise.race([promise, cancelState.promise]) as Promise<T>;
  }

  // adds a listener to the abort event
  addListener(listener: EventListener): void {
    // each listener is called in the scope of the host
    this._listeners.push(listener.bind(this.host));
  }

  // cancels all Promises that have been made since the last cancel
  cancel(): void {
    this._abortController.abort();
  }

  private _addEventListener(): void {
    this.abortSignal.addEventListener('abort', this._aborted.bind(this), {once: true});
  }

  // creates the Promise that only cancels
  private _initialize(): void {
    // initialize the AbortController and the AbortSignal variable
    this._abortController = new AbortController();
    this.abortSignal = this._abortController.signal;
    // add the abort event listener
    this._addEventListener();
    // intialize the cancel state
    let cancelState: CancelState = {abortSignal: this.abortSignal, wrapCount: 0};
    cancelState.promise = new Promise<void>((_, reject) => {
        // cancel the promise when the abort signal emits
        cancelState.abortSignal.addEventListener(
          'abort',
          (event: Event) => reject(event),
          {once: true},
        );
      })
      // the default error handler
      .catch((error: Error) => {
        // only throw an error if a Promise downstream can catch it
        if (cancelState.wrapCount > 0) {
          throw error;
        }
      });
    this._cancelState = cancelState;
  }

  // calls all listeners of the aobrt event
  private _aborted(event: Event): void {
    // create a new cancel only promise
    this._initialize();
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
