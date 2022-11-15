/**
 * @element thing-doer
 * @example <caption>Do a thing</caption>
 * ```html
 *         <thing-doer></thing-doer>
 * ```
 * @example Poorly formed
 * ```html
 *         <p>but we still allow it</p>
 * ```
 */
export class ThingDoer {
  /**
   * @example <caption>A Property</caption>
   * ```js
   *         el.prop = 'prop';
   * ```
   */
  prop;

  /**
   * @example <caption>A Method</caption>
   * ```js
   *         el.method();
   * ```
   */
  method() {}
}

/**
 * @example <caption>Call a Function</caption>
 * ```js
 *         f();
 * ```
 */
export function f() { }
