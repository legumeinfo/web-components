/**
 * Substitutes the value of a global variable with another global variable's
 * value, calls the decorated method, and then restores the original value of
 * the substituted global variable. If the second global variable is not defined
 * then the original global variable's value is used.
 *
 * @param target - The global variable to have its value substituted.
 * @param source - The global variable to use as the target's substitute.
 */
export function globalSubstitution<T>(target: string, source: string) {
  return (_: T, __: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const defaultGlobal: unknown = (window as any)[target];
      if ((window as any)[source] !== undefined) {
        (window as any)[target] = (window as any)[source];
      }
      try {
        const result = originalMethod.apply(this, args);
        (window as any)[target] = defaultGlobal;
        return result;
      } catch (error) {
        (window as any)[target] = defaultGlobal;
        throw error;
      }
    };
    return descriptor;
  };
}
