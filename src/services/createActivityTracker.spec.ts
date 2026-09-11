import { describe, expect, test } from 'vitest'
import { createActivityTracker } from '@/services/createActivityTracker'

describe('createActivityTracker', () => {
  test('given no work, idle resolves', async () => {
    const tracker = createActivityTracker()

    await expect(tracker.idle()).resolves.toBeUndefined()
  })

  test('given outstanding work, idle waits for it', async () => {
    const tracker = createActivityTracker()
    const { promise, resolve } = Promise.withResolvers<string>()
    let settled = false

    tracker.add(promise)

    const waiting = tracker.idle().then(() => {
      settled = true
    })

    expect(settled).toBe(false)

    resolve('done')
    await waiting

    expect(settled).toBe(true)
  })

  test('given work that rejects, idle still resolves', async () => {
    const tracker = createActivityTracker()

    tracker.add(Promise.reject(new Error('nope')))

    await expect(tracker.idle()).resolves.toBeUndefined()
  })

  test('given work registered while idle is waiting, waits for that too', async () => {
    const tracker = createActivityTracker()
    const first = Promise.withResolvers<string>()
    const second = Promise.withResolvers<string>()
    let settled = false

    tracker.add(first.promise)

    const waiting = tracker.idle().then(() => {
      settled = true
    })

    tracker.add(second.promise)
    first.resolve('one')
    await Promise.resolve()

    expect(settled).toBe(false)

    second.resolve('two')
    await waiting

    expect(settled).toBe(true)
  })

  test('wrap tracks a call for its whole duration', async () => {
    const tracker = createActivityTracker()
    const { promise, resolve } = Promise.withResolvers<string>()
    let settled = false

    const wrapped = tracker.wrap(() => promise)
    const call = wrapped()

    const waiting = tracker.idle().then(() => {
      settled = true
    })

    expect(settled).toBe(false)

    resolve('done')
    await waiting

    expect(settled).toBe(true)
    await expect(call).resolves.toBe('done')
  })
})
