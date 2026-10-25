import { describe, expect, test, vi } from 'vitest'
import { effect } from 'vue'
import { createDataStore } from './createDataStore'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'

describe('set and subscribe', () => {
  test('a value subscribed to before anything computes it resolves when it is computed', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const settled: unknown[] = []

    store.subscribe('key').then((value) => settled.push(value))

    expect(settled).toStrictEqual([])

    store.set('key', () => 'computed')

    await Promise.resolve()

    expect(settled).toStrictEqual(['computed'])
  })

  test('a value subscribed to after it is computed resolves immediately', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', () => 'computed')

    await expect(store.subscribe('key')).resolves.toBe('computed')
  })

  test('an async getter resolves the value when it settles', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', async () => 'computed')

    await expect(store.subscribe('key')).resolves.toBe('computed')
  })

  test('a getter that returns undefined resolves with undefined', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', () => undefined)

    await expect(store.subscribe('key')).resolves.toBeUndefined()
    expect(store.get('key')).toStrictEqual({ kind: 'value', value: undefined })
  })

  test('a getter that returns an Error resolves with it as a value', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const value = new Error('a real value')

    store.set('key', () => value)

    await expect(store.subscribe('key')).resolves.toBe(value)
    expect(store.get('key')).toStrictEqual({ kind: 'value', value })
  })

  test('a getter that throws rejects the value', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const error = new Error('failed')

    store.set('key', () => {
      throw error
    })

    await expect(store.subscribe('key')).rejects.toBe(error)
    expect(store.get('key')).toStrictEqual({ kind: 'error', error })
  })

  test('an async getter that rejects rejects the value', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const error = new Error('failed')

    store.set('key', async () => {
      throw error
    })

    await expect(store.subscribe('key')).rejects.toBe(error)
  })

  test.each([false, true])('a cancelled getter reports abandonment (async: %s)', async (isAsync) => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const error = new NavigationAbandonedError()

    store.set('key', () => {
      if (isAsync) {
        return Promise.reject(error)
      }

      throw error
    })

    await expect(store.subscribe('key')).rejects.toBe(error)
    expect(store.get('key')).toStrictEqual({ kind: 'abandoned' })
  })

  test('setting a key twice does not call the second getter', () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const second = vi.fn()

    store.set('key', () => 'first')
    store.set('key', second)

    expect(second).not.toHaveBeenCalled()
    expect(store.get('key')).toStrictEqual({ kind: 'value', value: 'first' })
  })

  test('subscribing to a key does not count as setting it', () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const getter = vi.fn(() => 'computed')

    store.subscribe('key')
    store.set('key', getter)

    expect(getter).toHaveBeenCalledOnce()
  })
})

describe('get', () => {
  test('is running while the getter is in flight', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', async () => 'computed')

    expect(store.get('key')).toStrictEqual({ kind: 'running' })

    await store.subscribe('key')

    expect(store.get('key')).toStrictEqual({ kind: 'value', value: 'computed' })
  })

  test('tells apart nothing asked for it, something waiting on it, and its getter in flight', () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.subscribe('waited')
    store.set('running', async () => 'computed')

    expect(store.get('never')).toStrictEqual({ kind: 'missing' })
    expect(store.get('waited')).toStrictEqual({ kind: 'pending' })
    expect(store.get('running')).toStrictEqual({ kind: 'running' })
  })

  test('a sync getter settles without waiting a tick', () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', () => 'computed')

    expect(store.get('key')).toStrictEqual({ kind: 'value', value: 'computed' })
  })

  test('tracks reactively, so a render reading it updates when the value settles', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const seen: (string | undefined)[] = []

    effect(() => {
      const result = store.get('key')

      seen.push(result.kind === 'value' ? String(result.value) : undefined)
    })

    expect(seen).toStrictEqual([undefined])

    store.set('key', async () => 'computed')
    await store.subscribe('key')

    expect(seen.at(-1)).toBe('computed')
  })

  test('is missing for a key nothing has touched', () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    expect(store.get('key')).toStrictEqual({ kind: 'missing' })
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

    store.set('key', () => 'computed')
    controller.abort(new Error('abandoned'))
    store.dispose()

    expect(store.get('key')).toStrictEqual({ kind: 'abandoned' })
  })

  test('reactive readers see abandonment when the store is disposed', () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const seen: string[] = []
    const runner = effect(() => seen.push(store.get('key').kind))

    store.set('key', () => 'computed')
    controller.abort(new NavigationAbandonedError())
    store.dispose()

    expect(seen.at(-1)).toBe('abandoned')
    runner.effect.stop()
  })

  test('a late getter result cannot replace abandonment', async () => {
    const pending = Promise.withResolvers<string>()
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', () => pending.promise)
    const waiting = store.subscribe('key')
    const reason = new NavigationAbandonedError()

    controller.abort(reason)
    store.dispose()
    await expect(waiting).rejects.toBe(reason)

    pending.resolve('late')
    await pending.promise

    expect(store.get('key')).toStrictEqual({ kind: 'abandoned' })
  })

  test('new subscribers reject and getters do not run after disposal', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })
    const reason = new Error('abandoned')
    const getter = vi.fn(() => 'unused')

    controller.abort(reason)
    store.dispose()
    store.set('key', getter)

    await expect(store.subscribe('key')).rejects.toBe(reason)
    expect(getter).not.toHaveBeenCalled()
    expect(store.get('key')).toStrictEqual({ kind: 'abandoned' })
  })

  test('leaves an already settled value settled for anything holding it', async () => {
    const controller = new AbortController()
    const store = createDataStore({ signal: controller.signal })

    store.set('key', () => 'computed')

    const held = store.subscribe('key')

    controller.abort(new Error('abandoned'))
    store.dispose()

    await expect(held).resolves.toBe('computed')
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
  expect(store.get('key')).toEqual({ kind: 'abandoned' })
})

test('aborting rejects unfinished work while retaining settled values', async () => {
  const controller = new AbortController()
  const store = createDataStore({ signal: controller.signal })
  const pending = Promise.withResolvers<string>()
  const reason = new NavigationAbandonedError()
  store.set('settled', () => 'kept')
  store.set('pending', () => pending.promise)
  const unfinished = store.subscribe('pending')

  controller.abort(reason)

  await expect(unfinished).rejects.toBe(reason)
  await expect(store.subscribe('settled')).resolves.toBe('kept')
  expect(store.get('settled')).toEqual({ kind: 'value', value: 'kept' })

  pending.resolve('late')
  await expect(store.subscribe('pending')).rejects.toBe(reason)
})
