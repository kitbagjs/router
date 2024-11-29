import { isPromise } from "./promises"

/**
 * Takes a props callback and returns a value
 * For sync props, this will return the props value or an error.
 * For async props, this will return a promise that resolves to the props value or an error.
 */
export function getPropsValue(callback: () => unknown): unknown {
  try {
    const value = callback()

    if (isPromise(value)) {
      return value.catch((error) => error)
    }

    return value
  } catch (error) {
    return error
  }
}
