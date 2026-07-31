import { MaybePromise } from '@/types/utilities'
import { isPromise } from './promises'

/**
 * How a props getter settled. Tagged so that a getter returning `undefined` or an `Error` stays a value.
 */
export type PropsResult = { kind: 'value', value: unknown } | { kind: 'error', error: unknown }

/**
 * Runs a props callback and captures how it settled rather than letting it throw, so that navigation can
 * tell a push or rejection apart from a genuine failure. Sync getters settle synchronously.
 */
export function getPropsValue(callback: () => unknown): MaybePromise<PropsResult> {
  try {
    const value = callback()

    if (isPromise(value)) {
      return value.then(
        (resolved): PropsResult => ({ kind: 'value', value: resolved }),
        (error: unknown): PropsResult => ({ kind: 'error', error }),
      )
    }

    return { kind: 'value', value }
  } catch (error) {
    return { kind: 'error', error }
  }
}
