import { describe, expect, test, vi } from 'vitest'
import { effect } from 'vue'
import { createDataStore } from './createDataStore'

describe('set and subscribe', () => {
  test('a value subscribed to before anything computes it resolves when it is computed', async () => {
    const store = createDataStore()
    const settled: unknown[] = []

    store.subscribe('key').then((value) => settled.push(value))

    expect(settled).toStrictEqual([])

    store.set('key', () => 'computed')

    await Promise.resolve()

    expect(settled).toStrictEqual(['computed'])
  })

  test('a value subscribed to after it is computed resolves immediately', async () => {
    const store = createDataStore()

    store.set('key', () => 'computed')

    await expect(store.subscribe('key')).resolves.toBe('computed')
  })

  test('an async getter resolves the value when it settles', async () => {
    const store = createDataStore()

    store.set('key', async () => 'computed')

    await expect(store.subscribe('key')).resolves.toBe('computed')
  })

  test('a getter that returns undefined resolves with undefined', async () => {
    const store = createDataStore()

    store.set('key', () => undefined)

    await expect(store.subscribe('key')).resolves.toBeUndefined()
    expect(store.get('key')).toStrictEqual({ kind: 'value', value: undefined })
  })

  test('a getter that returns an Error resolves with it as a value', async () => {
    const store = createDataStore()
    const value = new Error('a real value')

    store.set('key', () => value)

    await expect(store.subscribe('key')).resolves.toBe(value)
    expect(store.get('key')).toStrictEqual({ kind: 'value', value })
  })

  test('a getter that throws rejects the value', async () => {
    const store = createDataStore()
    const error = new Error('failed')

    store.set('key', () => {
      throw error
    })

    await expect(store.subscribe('key')).rejects.toBe(error)
    expect(store.get('key')).toStrictEqual({ kind: 'error', error })
  })

  test('an async getter that rejects rejects the value', async () => {
    const store = createDataStore()
    const error = new Error('failed')

    store.set('key', async () => {
      throw error
    })

    await expect(store.subscribe('key')).rejects.toBe(error)
  })

  test('setting a key twice does not call the second getter', () => {
    const store = createDataStore()
    const second = vi.fn()

    store.set('key', () => 'first')
    store.set('key', second)

    expect(second).not.toHaveBeenCalled()
    expect(store.get('key')).toStrictEqual({ kind: 'value', value: 'first' })
  })

  test('subscribing to a key does not count as setting it', () => {
    const store = createDataStore()
    const getter = vi.fn(() => 'computed')

    store.subscribe('key')
    store.set('key', getter)

    expect(getter).toHaveBeenCalledOnce()
  })
})

describe('get', () => {
  test('is running while the getter is in flight', async () => {
    const store = createDataStore()

    store.set('key', async () => 'computed')

    expect(store.get('key')).toStrictEqual({ kind: 'running' })

    await store.subscribe('key')

    expect(store.get('key')).toStrictEqual({ kind: 'value', value: 'computed' })
  })

  test('tells apart nothing asked for it, something waiting on it, and its getter in flight', () => {
    const store = createDataStore()

    store.subscribe('waited')
    store.set('running', async () => 'computed')

    expect(store.get('never')).toStrictEqual({ kind: 'missing' })
    expect(store.get('waited')).toStrictEqual({ kind: 'pending' })
    expect(store.get('running')).toStrictEqual({ kind: 'running' })
  })

  test('a sync getter settles without waiting a tick', () => {
    const store = createDataStore()

    store.set('key', () => 'computed')

    expect(store.get('key')).toStrictEqual({ kind: 'value', value: 'computed' })
  })

  test('tracks reactively, so a render reading it updates when the value settles', async () => {
    const store = createDataStore()
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
    const store = createDataStore()

    expect(store.get('key')).toStrictEqual({ kind: 'missing' })
  })
})

describe('dispose', () => {
  test('rejects a pending value so anything waiting resumes', async () => {
    const store = createDataStore()
    const reason = new Error('abandoned')
    const waiting = store.subscribe('key')

    store.dispose(reason)

    await expect(waiting).rejects.toBe(reason)
  })

  test('discards the value', () => {
    const store = createDataStore()

    store.set('key', () => 'computed')
    store.dispose(new Error('abandoned'))

    expect(store.get('key')).toStrictEqual({ kind: 'missing' })
  })

  test('leaves an already settled value settled for anything holding it', async () => {
    const store = createDataStore()

    store.set('key', () => 'computed')

    const held = store.subscribe('key')

    store.dispose(new Error('abandoned'))

    await expect(held).resolves.toBe('computed')
  })

  test('a value nobody is waiting on does not leak an unhandled rejection', async () => {
    const store = createDataStore()

    store.subscribe('key')
    store.dispose(new Error('abandoned'))

    await new Promise((resolve) => setTimeout(resolve, 10))
  })
})
