import { flushPromises } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import { createNavigationProgress, NavigationProgress, NavigationProgressTracker } from '@/services/createNavigationProgress'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { routes } from '@/utilities/testHelpers'

const to = createResolvedRoute(routes[0], { paramA: 'a' })

function begin(navigationProgress: NavigationProgress, expected: number): NavigationProgressTracker {
  return navigationProgress.begin({ to, from: null, expected })
}

describe('createNavigationProgress', () => {
  test('is idle until a navigation begins', () => {
    const progress = createNavigationProgress()

    expect(progress.pending.value).toBe(false)
    expect(progress.progress.value).toBe(0)
    expect(progress.to.value).toBeNull()
  })

  test('beginning a navigation is pending with the expected units and its routes', () => {
    const progress = createNavigationProgress()

    progress.begin({ to, from: null, expected: 3 })

    expect(progress.pending.value).toBe(true)
    expect(progress.total.value).toBe(3)
    expect(progress.settled.value).toBe(0)
    expect(progress.to.value).toBe(to)
    expect(progress.from.value).toBeNull()
  })

  test('each tracked unit advances settled as it settles, however it settles', async () => {
    const progress = createNavigationProgress()
    const tracker = begin(progress, 0)
    const first = Promise.withResolvers<string>()
    const second = Promise.withResolvers<string>()

    tracker.expect(2)
    tracker.track(first.promise, second.promise)

    first.resolve('done')
    await flushPromises()

    expect(progress.settled.value).toBe(1)
    expect(progress.progress.value).toBe(0.5)

    second.reject(new Error('failed'))
    await flushPromises()

    expect(progress.settled.value).toBe(2)
  })

  test('ends once closed and every unit has settled, not before', async () => {
    const progress = createNavigationProgress()
    const tracker = begin(progress, 1)
    const unit = Promise.withResolvers<string>()

    tracker.track(unit.promise)
    tracker.close()

    expect(progress.pending.value).toBe(true)

    unit.resolve('done')
    await flushPromises()

    expect(progress.pending.value).toBe(false)
    expect(progress.settled.value).toBe(1)
    expect(progress.total.value).toBe(1)
    expect(progress.progress.value).toBe(0)
    expect(progress.to.value).toBeNull()
  })

  test('closing with nothing outstanding ends immediately', () => {
    const progress = createNavigationProgress()
    const tracker = begin(progress, 0)

    tracker.close()

    expect(progress.pending.value).toBe(false)
  })

  test('aborting ends with the counts wiped', async () => {
    const progress = createNavigationProgress()
    const tracker = begin(progress, 2)

    tracker.track(Promise.resolve('done'))
    await flushPromises()
    tracker.abort()

    expect(progress.pending.value).toBe(false)
    expect(progress.settled.value).toBe(0)
    expect(progress.total.value).toBe(0)
  })

  test('beginning another navigation discards the one before it', async () => {
    const progress = createNavigationProgress()
    const first = begin(progress, 1)
    const unit = Promise.withResolvers<string>()

    first.track(unit.promise)
    first.close()

    progress.begin({ to, from: null, expected: 5 })

    unit.resolve('done')
    await flushPromises()
    first.expect(10)
    first.abort()

    expect(progress.pending.value).toBe(true)
    expect(progress.settled.value).toBe(0)
    expect(progress.total.value).toBe(5)
  })

  test('a unit settling after the navigation ended counts for nothing', async () => {
    const progress = createNavigationProgress()
    const tracker = begin(progress, 1)
    const unit = Promise.withResolvers<string>()

    tracker.track(unit.promise)
    tracker.abort()

    unit.resolve('done')
    await flushPromises()

    expect(progress.settled.value).toBe(0)
    expect(progress.pending.value).toBe(false)
  })

  test('an inert tracker counts nothing and leaves the state alone', async () => {
    const progress = createNavigationProgress()
    const tracker = progress.begin({ to, from: null, expected: 3, inert: true })

    tracker.expect(1)
    tracker.track(Promise.resolve('done'))
    await flushPromises()
    tracker.close()

    expect(progress.pending.value).toBe(false)
    expect(progress.total.value).toBe(0)
    expect(progress.to.value).toBeNull()
  })

  test('stopping aborts the navigation being counted', () => {
    const progress = createNavigationProgress()

    begin(progress, 2)
    progress.stop()

    expect(progress.pending.value).toBe(false)
    expect(progress.total.value).toBe(0)
  })
})
