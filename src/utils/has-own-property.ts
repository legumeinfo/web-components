/**
 * Equivalent to calling `hasOwnProperty` on the given object but is linter friendly.
 *
 * @param o - The object to call `hasOwnPropery` on.
 * @param p - The property to check for.
 *
 * @returns A boolean indicating whether or not the property exists in the object.
 */
export function hasOwnProperty(o: object, p: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, p);
}
