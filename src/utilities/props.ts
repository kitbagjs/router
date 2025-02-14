import { App } from 'vue'
import { isPromise } from './promises'
import { runWithContext } from './runWithContext'

/**
 * Takes a props callback and returns a value
 * For sync props, this will return the props value or an error.
 * For async props, this will return a promise that resolves to the props value or an error.
 */
export function getPropsValue(callback: () => unknown, app: App | null): unknown {
  try {
    const value = runWithContext(callback, app)

    if (isPromise(value)) {
      return value.catch((error: unknown) => error)
    }

    return value
  } catch (error) {
    return error
  }
}
