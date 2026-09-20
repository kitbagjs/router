import { afterEach, expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { ref, watch, watchEffect } from 'vue'
import { createViewTransitions, PendingViewTransition } from '@/services/createViewTransitions'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { stubViewTransitions } from '@/utilities/testHelpers'

let restore = (): void => {}

afterEach(() => {
  restore()
})

const to = createResolvedRoute(createRoute({ name: 'to', path: '/to' }))
const from = createResolvedRoute(createRoute({ name: 'from', path: '/from' }))

function navigation(types: string[] = []): PendingViewTransition {
  return { to, from, types }
}

test('the update does not run until the browser runs the callback', async () => {
  const stub = stubViewTransitions()
  const update = vi.fn()
  restore = stub.restore

  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation())
  viewTransitions.start(update)
  await flushPromises()

  expect(update).not.toHaveBeenCalled()

  await stub.transitions[0].run()

  expect(update).toHaveBeenCalledOnce()
})

test('resolves once the update has run', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation())

  const started = viewTransitions.start(() => {})
  const settled = vi.fn()

  started.then(settled)
  await flushPromises()

  expect(settled).not.toHaveBeenCalled()

  await stub.transitions[0].run()
  await flushPromises()

  expect(settled).toHaveBeenCalledOnce()
})

test('the callback waits for vue to render what the update changed', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  const source = ref(0)
  const settledLater = ref(0)
  const rendered: number[] = []

  watch(source, async (value) => {
    await Promise.resolve()
    settledLater.value = value
  })

  watchEffect(() => {
    rendered.push(settledLater.value)
  })

  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation())
  viewTransitions.start(() => {
    source.value = 1
  })

  await stub.transitions[0].run()

  expect(rendered).toContain(1)
})

test('a navigation arriving before the callback runs takes over the pending update', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  const first = vi.fn()
  const second = vi.fn()
  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation())
  const firstStarted = viewTransitions.start(first)
  viewTransitions.prepare(navigation())
  const secondStarted = viewTransitions.start(second)

  expect(stub.transitions).toHaveLength(1)

  await stub.transitions[0].run()

  expect(first).not.toHaveBeenCalled()
  expect(second).toHaveBeenCalledOnce()
  await expect(firstStarted).resolves.toBeUndefined()
  await expect(secondStarted).resolves.toBeUndefined()
})

test('a navigation arriving after the callback ran starts its own transition', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation())
  viewTransitions.start(() => {})
  await stub.transitions[0].run()
  viewTransitions.prepare(navigation())
  viewTransitions.start(() => {})

  expect(stub.transitions).toHaveLength(2)
})

test('a skipped transition does not surface as an unhandled rejection', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation())
  viewTransitions.start(() => {})

  stub.transitions[0].skip()

  await flushPromises()
})

test('an update that throws rejects the navigation', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation())

  const started = viewTransitions.start(() => {
    throw new Error('commit failed')
  })

  await stub.transitions[0].run()

  await expect(started).rejects.toThrow('commit failed')
})

test('passes the prepared types when the browser understands them', async () => {
  const stub = stubViewTransitions({ types: true })
  restore = stub.restore

  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation(['slide']))
  viewTransitions.start(() => {})

  expect(stub.transitions[0].types).toEqual(['slide'])
})

test('leaves types out when the browser does not understand them', async () => {
  const stub = stubViewTransitions({ types: false })
  restore = stub.restore

  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation(['slide']))
  viewTransitions.start(() => {})

  expect(stub.transitions[0].types).toBeUndefined()
})

test('preparing exposes the navigation before the transition exists', () => {
  const { viewTransition, prepare } = createViewTransitions()

  expect(viewTransition.isTransitioning).toBe(false)

  prepare(navigation(['slide']))

  expect(viewTransition).toMatchObject({
    isTransitioning: true,
    to,
    from,
    types: ['slide'],
    transition: undefined,
  })
})

test('starting exposes the transition until it finishes', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  const { viewTransition, prepare, start } = createViewTransitions()

  prepare(navigation())
  start(() => {})

  expect(viewTransition.transition).toMatchObject({ ready: expect.any(Promise) })

  await stub.transitions[0].run()
  await flushPromises()

  expect(viewTransition.isTransitioning).toBe(false)
  expect(viewTransition.transition).toBeUndefined()
})

test('a transition finishing does not clear a newer navigation that has since been prepared', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  const { viewTransition, prepare, start } = createViewTransitions()

  prepare(navigation())
  start(() => {})
  await stub.transitions[0].run()

  const newer = createResolvedRoute(createRoute({ name: 'newer', path: '/newer' }))

  prepare({ to: newer, from: to, types: [] })
  await flushPromises()

  expect(viewTransition.isTransitioning).toBe(true)
  expect(viewTransition.to).toBe(newer)
})

test('cancelling forgets a prepared navigation only while it still owns the state', () => {
  const { viewTransition, prepare, cancel } = createViewTransitions()
  const first = navigation()

  prepare(first)
  cancel(first)

  expect(viewTransition.isTransitioning).toBe(false)

  const newer = createResolvedRoute(createRoute({ name: 'newer', path: '/newer' }))

  prepare({ to: newer, from: to, types: [] })
  cancel(first)

  expect(viewTransition.to).toBe(newer)
})

test('resetting forgets whatever is in flight', () => {
  const { viewTransition, prepare, reset } = createViewTransitions()

  prepare(navigation(['slide']))
  reset()

  expect(viewTransition).toMatchObject({
    isTransitioning: false,
    to: undefined,
    types: [],
  })
})
