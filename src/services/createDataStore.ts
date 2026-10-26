import { markRaw, reactive, shallowRef, ShallowRef } from 'vue'
import { isPromise } from '@/utilities/promises'
import { MaybePromise } from '@/types/utilities'

export type DataResultValue<T = unknown> = { kind: 'value', value: T }

export type DataResultError = { kind: 'error', error: unknown }

export type DataResultAbandoned = { kind: 'abandoned' }

export type DataResultSettled<T = unknown> = DataResultValue<T> | DataResultError | DataResultAbandoned

export type DataResultPending = { kind: 'pending' }

export type DataResultRunning = { kind: 'running' }

export type DataResultMissing = { kind: 'missing' }

/**
 * Where a key has got to: nothing has asked for it, something is waiting on it, its getter is in flight,
 * or how that getter settled. Tagged so that a getter returning `undefined` or an `Error` stays a value.
 */
export type DataResult<T = unknown> = DataResultValue<T> | DataResultError | DataResultAbandoned | DataResultPending | DataResultRunning | DataResultMissing

const ABANDONED: DataResultAbandoned = { kind: 'abandoned' }

const PENDING: DataResultPending = { kind: 'pending' }

const RUNNING: DataResultRunning = { kind: 'running' }

const MISSING: DataResultMissing = { kind: 'missing' }

export type DataStoreSettledEvent<T = unknown> = {
  result: DataResultSettled<T>,
}

type Entry<T> = {
  promise: Promise<T>,
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason: unknown) => void,
  state: ShallowRef<DataResult<T>>,
}

/**
 * A set of values that live and die together. A link owns one for whatever it points at, and the current
 * navigation owns one.
 */
export type DataStore<T = unknown> = {
  /**
   * The value for a key, whether or not anything has computed it yet. Subscribing to a key nobody has set
   * leaves a promise waiting for whoever does.
   */
  subscribe: (key: string) => Promise<T>,
  /**
   * Computes a key, unless something already has. A key promoted from another store while its getter is
   * still running is left alone, so navigation adopts it rather than computing it a second time.
   */
  set: (key: string, getter: () => MaybePromise<T>) => void,
  /**
   * What is known about a key, without waiting for it. Reactive, and readable during render.
   */
  get: (key: string) => DataResult<T>,
  /**
   * Discards stored values after their signal has been aborted.
   */
  dispose: () => void,
}

type CreateDataStoreOptions<T> = {
  signal: AbortSignal,
  onSettled?: (event: DataStoreSettledEvent<T>) => void,
}

export function createDataStore<T = unknown>({ signal, onSettled }: CreateDataStoreOptions<T>): DataStore<T> {
  const entries: Map<string, Entry<T>> = reactive(new Map())

  function create(): Entry<T> {
    const { promise, resolve, reject } = Promise.withResolvers<T>()

    // a value nobody happens to await must not surface as an unhandled rejection
    promise.catch(() => {})

    return markRaw({ promise, resolve, reject, state: shallowRef<DataResult<T>>(PENDING) })
  }

  function entry(key: string): Entry<T> {
    const existing = entries.get(key)

    if (existing) {
      return existing
    }

    const created = create()

    if (signal.aborted) {
      settle(created, ABANDONED)

      return created
    }

    entries.set(key, created)

    return created
  }

  function settle(target: Entry<T>, result: DataResultSettled<T>): void {
    const current = target.state.value

    if (current.kind === 'value' || current.kind === 'error' || current.kind === 'abandoned') {
      return
    }

    target.state.value = result

    switch (result.kind) {
      case 'value':
        target.resolve(result.value)
        break
      case 'error':
        target.reject(result.error)
        break
      case 'abandoned':
        target.reject(signal.reason)
        break
      default: {
        const exhaustive: never = result
        throw new Error(`Switch is not exhaustive for data result: ${JSON.stringify(exhaustive)}`)
      }
    }

    onSettled?.({ result: target.state.value })
  }

  const subscribe: DataStore<T>['subscribe'] = (key) => entry(key).promise

  const set: DataStore<T>['set'] = (key, getter) => {
    if (signal.aborted) {
      return
    }

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

  const get: DataStore<T>['get'] = (key) => {
    const result = entries.get(key)?.state.value

    if (!result && signal.aborted) {
      return ABANDONED
    }

    return result ?? MISSING
  }

  signal.addEventListener('abort', () => {
    for (const entry of entries.values()) {
      settle(entry, ABANDONED)
    }
  }, { once: true })

  const dispose: DataStore<T>['dispose'] = () => {
    entries.clear()
  }

  return {
    subscribe,
    set,
    get,
    dispose,
  }
}
