import { describe, expect, test, vi } from 'vitest'
import { effect } from 'vue'
import { createDataStore } from './createDataStore'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { ComputationResponse } from '@/types/computationResponse'

const computedResponse: ComputationResponse = {
  status: 'SUCCESS',
  value: 'computed',
}

describe('set and subscribe', () => {
  test('a value subscribed to before anything computes it resolves when it is computed', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const settled: unknown[] = []

    store.subscribe('key').then((value) => settled.push(value))

    expect(settled).toStrictEqual([])

    store.set('key', () => computedResponse)

    await Promise.resolve()

    expect(settled).toStrictEqual([computedResponse])
  })

  test('a value subscribed to after it is computed resolves immediately', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', () => computedResponse)

    await expect(store.subscribe('key')).resolves.toBe(computedResponse)
  })

  test('an async getter resolves the value when it settles', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', async () => computedResponse)

    await expect(store.subscribe('key')).resolves.toBe(computedResponse)
  })

  test('a successful response preserves undefined data', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    const response: ComputationResponse = {
      status: 'SUCCESS',
      value: undefined,
    }

    store.set('key', () => response)

    await expect(store.subscribe('key')).resolves.toBe(response)
    expect(store.get('key')).toStrictEqual(response)
  })

  test('a successful response preserves an Error as data', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const value: ComputationResponse = {
      status: 'SUCCESS',
      value: new Error('a real value'),
    }

    store.set('key', () => value)

    await expect(store.subscribe('key')).resolves.toBe(value)
    expect(store.get('key')).toStrictEqual(value)
  })

  test('an error response retains the original error and source', async () => {
    const controller = new AbortController()
    const onSettled = vi.fn()
    const store = createDataStore({ signal: controller.signal, onSettled })
    const response: ComputationResponse = {
      status: 'ERROR',
      error: new Error('failed'),
      source: 'loader',
    }

    store.set('key', () => response)

    await expect(store.subscribe('key')).resolves.toBe(response)
    expect(store.get('key')).toBe(response)
    expect(onSettled).toHaveBeenCalledExactlyOnceWith({ result: response })
  })

  test('setting a key twice does not call the second getter', () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const second = vi.fn()

    store.set('key', () => computedResponse)
    store.set('key', second)

    expect(second).not.toHaveBeenCalled()
    expect(store.get('key')).toStrictEqual(computedResponse)
  })

  test('subscribing to a key does not count as setting it', () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const getter = vi.fn(() => computedResponse)

    store.subscribe('key')
    store.set('key', getter)

    expect(getter).toHaveBeenCalledOnce()
  })
})

describe('get', () => {
  test('is running while the getter is in flight', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', async () => computedResponse)

    expect(store.get('key')).toStrictEqual({ status: 'RUNNING' })

    await store.subscribe('key')

    expect(store.get('key')).toStrictEqual(computedResponse)
  })

  test('tells apart nothing asked for it, something waiting on it, and its getter in flight', () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.subscribe('waited')
    store.set('running', async () => computedResponse)

    expect(store.get('never')).toStrictEqual({ status: 'MISSING' })
    expect(store.get('waited')).toStrictEqual({ status: 'PENDING' })
    expect(store.get('running')).toStrictEqual({ status: 'RUNNING' })
  })

  test('a sync getter settles without waiting a tick', () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', () => computedResponse)

    expect(store.get('key')).toStrictEqual(computedResponse)
  })

  test('tracks reactively, so a render reading it updates when the value settles', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const seen: (ComputationResponse | undefined)[] = []

    effect(() => {
      const result = store.get('key')

      seen.push(result.status === 'SUCCESS' ? result : undefined)
    })

    expect(seen).toStrictEqual([undefined])

    store.set('key', async () => computedResponse)
    await store.subscribe('key')

    expect(seen.at(-1)).toBe(computedResponse)
  })

  test('is missing for a key nothing has touched', () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    expect(store.get('key')).toStrictEqual({ status: 'MISSING' })
  })
})

describe('dispose', () => {
  test('rejects a pending value so anything waiting resumes', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const reason = new Error('abandoned')
    const waiting = store.subscribe('key')

    controller.abort(reason)
    store.dispose()

    await expect(waiting).rejects.toBe(reason)
  })

  test('discards the value and reports abandonment', () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', () => computedResponse)
    controller.abort(new Error('abandoned'))
    store.dispose()

    expect(store.get('key')).toStrictEqual({ status: 'ABANDONED' })
  })

  test('reactive readers see abandonment when the store is disposed', () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const seen: string[] = []
    const runner = effect(() => seen.push(store.get('key').status))

    store.set('key', () => computedResponse)
    controller.abort(new NavigationAbandonedError())
    store.dispose()

    expect(seen.at(-1)).toBe('ABANDONED')
    runner.effect.stop()
  })

  test('a late getter result cannot replace abandonment', async () => {
    const pending = Promise.withResolvers<ComputationResponse>()
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', () => pending.promise)
    const waiting = store.subscribe('key')
    const reason = new NavigationAbandonedError()

    controller.abort(reason)
    store.dispose()
    await expect(waiting).rejects.toBe(reason)

    pending.resolve({ status: 'SUCCESS', value: 'late' })
    await pending.promise

    expect(store.get('key')).toStrictEqual({ status: 'ABANDONED' })
  })

  test('new subscribers reject and getters do not run after disposal', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const reason = new Error('abandoned')
    const getter = vi.fn(() => computedResponse)

    controller.abort(reason)
    store.dispose()
    store.set('key', getter)

    await expect(store.subscribe('key')).rejects.toBe(reason)
    expect(getter).not.toHaveBeenCalled()
    expect(store.get('key')).toStrictEqual({ status: 'ABANDONED' })
  })

  test('leaves an already settled value settled for anything holding it', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', () => computedResponse)

    const held = store.subscribe('key')

    controller.abort(new Error('abandoned'))
    store.dispose()

    await expect(held).resolves.toBe(computedResponse)
  })

  test('a value nobody is waiting on does not leak an unhandled rejection', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.subscribe('key')
    controller.abort(new Error('abandoned'))
    store.dispose()

    await new Promise((resolve) => setTimeout(resolve, 10))
  })
})

test('an already aborted signal rejects subscribers and skips getters', async () => {
  const controller = new AbortController()
  const reason = new NavigationAbandonedError()
  controller.abort(reason)
  const store = createDataStore({ signal: controller.signal })
  const getter = vi.fn()

  store.set('key', getter)

  await expect(store.subscribe('key')).rejects.toBe(reason)
  expect(getter).not.toHaveBeenCalled()
  expect(store.get('key')).toEqual({ status: 'ABANDONED' })
})

test('aborting rejects unfinished work while retaining settled values', async () => {
  const controller = new AbortController()
  const store = createDataStore({ signal: controller.signal })
  const pending = Promise.withResolvers<ComputationResponse>()
  const reason = new NavigationAbandonedError()
  store.set('settled', () => computedResponse)
  store.set('pending', () => pending.promise)
  const unfinished = store.subscribe('pending')

  controller.abort(reason)

  await expect(unfinished).rejects.toBe(reason)
  await expect(store.subscribe('settled')).resolves.toBe(computedResponse)
  expect(store.get('settled')).toEqual(computedResponse)

  pending.resolve({ status: 'SUCCESS', value: 'late' })
  await expect(store.subscribe('pending')).rejects.toBe(reason)
})

test('onSettled reports a value once when its work finishes', async () => {
  const controller = new AbortController()
  const onSettled = vi.fn()
  const store = createDataStore({ signal: controller.signal, onSettled })
  const pending = Promise.withResolvers<ComputationResponse>()

  store.set('key', () => pending.promise)
  store.set('key', () => computedResponse)
  expect(onSettled).not.toHaveBeenCalled()

  pending.resolve(computedResponse)
  await store.subscribe('key')
  controller.abort(new NavigationAbandonedError())

  expect(onSettled).toHaveBeenCalledExactlyOnceWith({
    result: computedResponse,
  })
})
