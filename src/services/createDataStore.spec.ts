import { describe, expect, test, vi } from 'vitest'
import { effect } from 'vue'
import { createDataStore } from './createDataStore'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { CallbackContextResponse } from '@/types/callbackContext'

const computedResponse: CallbackContextResponse = {
  status: 'SUCCESS',
  value: 'computed',
}

describe('set and subscribe', () => {
  test('subscribers can wait before computation starts', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const waiting = store.subscribe('key')

    store.set('key', () => computedResponse)

    await expect(waiting).resolves.toBe(computedResponse)
  })

  test('subscribers can read a settled response', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', () => computedResponse)

    expect(store.get('key')).toBe(computedResponse)
    await expect(store.subscribe('key')).resolves.toBe(computedResponse)
  })

  test('an error response retains the original error and source', async () => {
    const controller = new AbortController()
    const onSettled = vi.fn()
    const store = createDataStore({ signal: controller.signal, onSettled })
    const response: CallbackContextResponse = {
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
})

describe('get', () => {
  test('tracks a value from missing through computation to success', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const pending = Promise.withResolvers<CallbackContextResponse>()

    expect(store.get('key')).toEqual({ status: 'MISSING' })
    const waiting = store.subscribe('key')
    expect(store.get('key')).toEqual({ status: 'PENDING' })

    store.set('key', () => pending.promise)
    expect(store.get('key')).toEqual({ status: 'RUNNING' })

    pending.resolve(computedResponse)
    await expect(waiting).resolves.toBe(computedResponse)
    expect(store.get('key')).toBe(computedResponse)
  })

  test('reactive readers update when a response settles', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const seen: (CallbackContextResponse | undefined)[] = []

    const reader = effect(() => {
      const result = store.get('key')

      seen.push(result.status === 'SUCCESS' ? result : undefined)
    })

    expect(seen).toStrictEqual([undefined])

    store.set('key', async () => computedResponse)
    await store.subscribe('key')

    expect(seen.at(-1)).toBe(computedResponse)
    reader.effect.stop()
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
  const pending = Promise.withResolvers<CallbackContextResponse>()
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
  expect(store.get('pending')).toEqual({ status: 'ABANDONED' })
})

test('onSettled reports a value once when its work finishes', async () => {
  const controller = new AbortController()
  const onSettled = vi.fn()
  const store = createDataStore({ signal: controller.signal, onSettled })
  const pending = Promise.withResolvers<CallbackContextResponse>()

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

test('getEntries includes pending, running, successful, failed, and abandoned results', async () => {
  const controller = new AbortController()
  const store = createDataStore({ signal: controller.signal })
  const error = new Error('failed')
  store.subscribe('pending')
  store.set('running', () => new Promise(() => {}))
  store.set('success', () => computedResponse)
  store.set('error', () => ({ status: 'ERROR', source: 'loader', error }))

  expect(store.getEntries()).toEqual([
    { key: 'pending', value: { status: 'PENDING' } },
    { key: 'running', value: { status: 'RUNNING' } },
    { key: 'success', value: computedResponse },
    { key: 'error', value: { status: 'ERROR', source: 'loader', error } },
  ])
  controller.abort(new NavigationAbandonedError())
  expect(store.getEntries().slice(0, 2)).toEqual([
    { key: 'pending', value: { status: 'ABANDONED' } },
    { key: 'running', value: { status: 'ABANDONED' } },
  ])
})
