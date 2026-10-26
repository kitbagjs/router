import { markRaw, reactive, shallowRef, ShallowRef } from 'vue'
import { isPromise } from '@/utilities/promises'
import { MaybePromise } from '@/types/utilities'
import { ComputationResponse } from '@/types/computationResponse'

export type DataResultAbandoned = { status: 'ABANDONED' }

export type DataResultPending = { status: 'PENDING' }

export type DataResultRunning = { status: 'RUNNING' }

export type DataResultMissing = { status: 'MISSING' }

export type DataResultSettled = ComputationResponse | DataResultAbandoned

/**
 * A computation response or its current lifecycle state.
 */
export type DataResult = DataResultSettled | DataResultPending | DataResultRunning | DataResultMissing

const ABANDONED: DataResultAbandoned = { status: 'ABANDONED' }

const PENDING: DataResultPending = { status: 'PENDING' }

const RUNNING: DataResultRunning = { status: 'RUNNING' }

const MISSING: DataResultMissing = { status: 'MISSING' }

export type DataStoreSettledEvent = {
  result: DataResultSettled,
}

type Entry = {
  promise: Promise<ComputationResponse>,
  resolve: (value: ComputationResponse | PromiseLike<ComputationResponse>) => void,
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
  subscribe: (key: string) => Promise<ComputationResponse>,
  /**
   * Computes a key, unless something already has. A key promoted from another store while its getter is
   * still running is left alone, so navigation adopts it rather than computing it a second time.
   */
  set: (key: string, getter: () => MaybePromise<ComputationResponse>) => void,
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
    const { promise, resolve, reject } = Promise.withResolvers<ComputationResponse>()

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

  function settle(target: Entry, result: DataResultSettled): void {
    const current = target.state.value

    if (current.status !== 'PENDING' && current.status !== 'RUNNING') {
      return
    }

    target.state.value = result

    switch (result.status) {
      case 'SUCCESS':
      case 'ERROR':
      case 'PUSH':
      case 'REJECT':
        target.resolve(result)
        break
      case 'ABANDONED':
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

    if (target.state.value.status !== 'PENDING') {
      return
    }

    target.state.value = RUNNING

    const result = getter()

    if (isPromise(result)) {
      result.then((resolved) => settle(target, resolved))

      return
    }

    settle(target, result)
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
