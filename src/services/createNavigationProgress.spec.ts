import { flushPromises } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { createNavigationProgress } from '@/services/createNavigationProgress'

test('each tracked unit advances progress as it settles, however it settles', async () => {
  const controller = new AbortController()
  const progress = createNavigationProgress({ signal: controller.signal, expected: 1 })
  const first = Promise.withResolvers<string>()
  const second = Promise.withResolvers<string>()

  progress.expect(1)
  progress.track(first.promise, second.promise)

  first.resolve('done')
  await flushPromises()

  expect(progress.total.value).toBe(2)
  expect(progress.settled.value).toBe(1)
  expect(progress.progress.value).toBe(0.5)

  second.reject(new Error('failed'))
  await flushPromises()

  expect(progress.settled.value).toBe(2)
  expect(progress.pending.value).toBe(true)
})

test('ends once closed and every unit has settled, not before', async () => {
  const controller = new AbortController()
  const progress = createNavigationProgress({ signal: controller.signal, expected: 1 })
  const unit = Promise.withResolvers<string>()

  progress.track(unit.promise)
  progress.close()

  expect(progress.pending.value).toBe(true)

  unit.resolve('done')
  await flushPromises()

  expect(progress.pending.value).toBe(false)
  expect(progress.settled.value).toBe(1)
  expect(progress.total.value).toBe(1)
  expect(progress.progress.value).toBe(0)
})

test('closing with nothing outstanding ends immediately', () => {
  const controller = new AbortController()
  const progress = createNavigationProgress({ signal: controller.signal })

  progress.close()

  expect(progress.pending.value).toBe(false)
})

test('aborting clears the counts and ignores late results', async () => {
  const controller = new AbortController()
  const progress = createNavigationProgress({ signal: controller.signal, expected: 2 })
  const pending = Promise.withResolvers<string>()

  progress.track(Promise.resolve('done'), pending.promise)
  await flushPromises()
  expect(progress.settled.value).toBe(1)

  controller.abort()
  pending.resolve('late')
  await flushPromises()

  expect(progress.pending.value).toBe(false)
  expect(progress.settled.value).toBe(0)
  expect(progress.total.value).toBe(0)
})

test('aborting after completion preserves the final counts', async () => {
  const controller = new AbortController()
  const progress = createNavigationProgress({ signal: controller.signal, expected: 1 })

  progress.track(Promise.resolve('done'))
  progress.close()
  await flushPromises()
  controller.abort()

  expect(progress.pending.value).toBe(false)
  expect(progress.total.value).toBe(1)
  expect(progress.settled.value).toBe(1)
})

test('an inert tracker counts nothing', async () => {
  const controller = new AbortController()
  const progress = createNavigationProgress({ signal: controller.signal, expected: 3, inert: true })

  progress.expect(1)
  progress.track(Promise.resolve('done'))
  await flushPromises()
  progress.close()

  expect(progress.pending.value).toBe(false)
  expect(progress.total.value).toBe(0)
  expect(progress.settled.value).toBe(0)
})
