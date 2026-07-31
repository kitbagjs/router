import { markRaw, reactive, shallowRef, ShallowRef } from 'vue'
import { isPromise } from '@/utilities/promises'

export type DataResultValue = { kind: 'value', value: unknown }

export type DataResultError = { kind: 'error', error: unknown }

export type DataResultPending = { kind: 'pending' }

export type DataResultRunning = { kind: 'running' }

export type DataResultMissing = { kind: 'missing' }

/**
 * Where a key has got to: nothing has asked for it, something is waiting on it, its getter is in flight,
 * or how that getter settled. Tagged so that a getter returning `undefined` or an `Error` stays a value.
 */
export type DataResult = DataResultValue | DataResultError | DataResultPending | DataResultRunning | DataResultMissing

const PENDING: DataResultPending = { kind: 'pending' }

const RUNNING: DataResultRunning = { kind: 'running' }

const MISSING: DataResultMissing = { kind: 'missing' }

type Entry = {
  promise: Promise<unknown>,
  resolve: (value: unknown) => void,
  reject: (reason: unknown) => void,
  state: ShallowRef<DataResult>,
}

/**
 * A set of values that live and die together. A link owns one for whatever it points at, and the current
 * navigation owns one.
 */
export type DataStore = {
  /**
   * The value for a key, whether or not anything has computed it yet. Subscribing to a key nobody has set
   * leaves a promise waiting for whoever does.
   */
  subscribe: (key: string) => Promise<unknown>,
  /**
   * Computes a key, unless something already has. A key promoted from another store while its getter is
   * still running is left alone, so navigation adopts it rather than computing it a second time.
   */
  set: (key: string, getter: () => unknown) => void,
  /**
   * What is known about a key, without waiting for it. Reactive, and readable during render.
   */
  get: (key: string) => DataResult,
  /**
   * Ends the store. Every value is rejected so that anything waiting on one resumes rather than staying
   * suspended, then discarded.
   */
  dispose: (reason: Error) => void,
}

export function createDataStore(): DataStore {
  const entries: Map<string, Entry> = reactive(new Map())

  function create(): Entry {
    const { promise, resolve, reject } = Promise.withResolvers<unknown>()

    // a value nobody happens to await must not surface as an unhandled rejection
    promise.catch(() => {})

    return markRaw({ promise, resolve, reject, state: shallowRef<DataResult>(PENDING) })
  }

  function entry(key: string): Entry {
    const existing = entries.get(key)

    if (existing) {
      return existing
    }

    const created = create()

    entries.set(key, created)

    return created
  }

  function settle(target: Entry, result: DataResultValue | DataResultError): void {
    const current = target.state.value

    if (current.kind === 'value' || current.kind === 'error') {
      return
    }

    target.state.value = result

    if (result.kind === 'value') {
      target.resolve(result.value)
    } else {
      target.reject(result.error)
    }
  }

  const subscribe: DataStore['subscribe'] = (key) => entry(key).promise

  const set: DataStore['set'] = (key, getter) => {
    const target = entry(key)

    if (target.state.value.kind !== 'pending') {
      return
    }

    target.state.value = RUNNING

    try {
      const value = getter()

      if (isPromise(value)) {
        value.then(
          (resolved) => settle(target, { kind: 'value', value: resolved }),
          (error: unknown) => settle(target, { kind: 'error', error }),
        )

        return
      }

      settle(target, { kind: 'value', value })
    } catch (error) {
      settle(target, { kind: 'error', error })
    }
  }

  const get: DataStore['get'] = (key) => entries.get(key)?.state.value ?? MISSING

  const dispose: DataStore['dispose'] = (reason) => {
    for (const [key, dying] of entries) {
      entries.delete(key)
      settle(dying, { kind: 'error', error: reason })
    }
  }

  return {
    subscribe,
    set,
    get,
    dispose,
  }
}
