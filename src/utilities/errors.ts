/**
 * Returns the response and any error as a tuple.
 */
export function getResponseAndError<T>(callback: () => T): [T | undefined, Error | undefined] {
  try {
    return [callback(), undefined]
  } catch (error) {
    return [undefined, error as Error]
  }
}
