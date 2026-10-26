import { markRaw, reactive, shallowRef, ShallowRef } from 'vue'
import { isPromise } from '@/utilities/promises'

export type DataResultValue = { kind: 'value', value: unknown }

export type DataResultError = { kind: 'error', error: unknown }

export type DataResultAbandoned = { kind: 'abandoned' }

export type DataResultPending = { kind: 'pending' }

export type DataResultRunning = { kind: 'running' }

export type DataResultMissing = { kind: 'missing' }

/**
 * Where a key has got to: nothing has asked for it, something is waiting on it, its getter is in flight,
 * or how that getter settled. Tagged so that a getter returning `undefined` or an `Error` stays a value.
 */
export type DataResult = DataResultValue | DataResultError | DataResultAbandoned | DataResultPending | DataResultRunning | DataResultMissing

const ABANDONED: DataResultAbandoned = { kind: 'abandoned' }

const PENDING: DataResultPending = { kind: 'pending' }

const RUNNING: DataResultRunning = { kind: 'running' }

const MISSING: DataResultMissing = { kind: 'missing' }

export type DataStoreSettledEvent = {
  result: DataResultValue | DataResultError | DataResultAbandoned,
}

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
   * Discards stored values after their signal has been aborted.
   */
  dispose: () => void,
}

type CreateDataStoreOptions = {
  signal: AbortSignal,
  onSettled?: (event: DataStoreSettledEvent) => void,
}

export function createDataStore({ signal, onSettled }: CreateDataStoreOptions): DataStore {
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

    if (signal.aborted) {
      settle(created, ABANDONED)

      return created
    }

    entries.set(key, created)

    return created
  }

  function settle(target: Entry, result: DataResultValue | DataResultError | DataResultAbandoned): void {
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

  const subscribe: DataStore['subscribe'] = (key) => entry(key).promise

  const set: DataStore['set'] = (key, getter) => {
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

  const get: DataStore['get'] = (key) => {
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

  const dispose: DataStore['dispose'] = () => {
    entries.clear()
  }

  return {
    subscribe,
    set,
    get,
    dispose,
  }
}
