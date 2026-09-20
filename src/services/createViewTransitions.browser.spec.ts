import { afterEach, beforeAll, expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { ref, watch, watchEffect } from 'vue'
import { register } from 'view-transitions-mock'
import { createViewTransitions, PendingViewTransition } from '@/services/createViewTransitions'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'

beforeAll(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {})
  register({ forced: true })
})

afterEach(async () => {
  // a transition one test leaves running collides with the next test's inside the mock
  const active = document.activeViewTransition

  active?.skipTransition()
  await active?.finished

  vi.restoreAllMocks()
})

const to = createResolvedRoute(createRoute({ name: 'to', path: '/to' }))
const from = createResolvedRoute(createRoute({ name: 'from', path: '/from' }))

function navigation(types: string[] = []): PendingViewTransition {
  return { to, from, types }
}

function transitionOf({ viewTransition }: ReturnType<typeof createViewTransitions>): ViewTransition {
  if (!viewTransition.transition) {
    throw new Error('no transition has started')
  }

  return viewTransition.transition
}

test('the update runs inside the transition callback rather than when the transition starts', async () => {
  const update = vi.fn()
  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation())

  const started = viewTransitions.start(update)

  expect(update).not.toHaveBeenCalled()

  await started

  expect(update).toHaveBeenCalledOnce()
})

test('resolves after the update has run and before the animation finishes', async () => {
  const order: string[] = []
  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation())

  const started = viewTransitions.start(() => {
    order.push('update')
  })
  const transition = transitionOf(viewTransitions)

  started.then(() => order.push('started'))
  transition.finished.then(() => order.push('finished'))

  await transition.finished
  await flushPromises()

  expect(order).toEqual(['update', 'started', 'finished'])
})

test('the callback waits for vue to render what the update changed', async () => {
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

  await transitionOf(viewTransitions).updateCallbackDone

  expect(rendered).toContain(1)
})

test('a navigation arriving before the callback runs takes over the pending update', async () => {
  const startViewTransition = vi.spyOn(document, 'startViewTransition')
  const first = vi.fn()
  const second = vi.fn()
  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation())
  const firstStarted = viewTransitions.start(first)
  viewTransitions.prepare(navigation())
  const secondStarted = viewTransitions.start(second)

  await Promise.all([firstStarted, secondStarted])

  expect(startViewTransition).toHaveBeenCalledOnce()
  expect(first).not.toHaveBeenCalled()
  expect(second).toHaveBeenCalledOnce()
})

test('a navigation arriving after the callback ran starts its own transition, and the browser skips the first', async () => {
  const startViewTransition = vi.spyOn(document, 'startViewTransition')
  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation())
  await viewTransitions.start(() => {})

  const first = transitionOf(viewTransitions)

  viewTransitions.prepare(navigation())
  await viewTransitions.start(() => {})

  expect(startViewTransition).toHaveBeenCalledTimes(2)
  await expect(first.finished).resolves.toBeUndefined()
  await expect(first.ready).rejects.toThrow()
})

test('a skipped transition does not surface as an unhandled rejection', async () => {
  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation())
  viewTransitions.start(() => {})

  transitionOf(viewTransitions).skipTransition()

  await flushPromises()
})

test('the prepared types are given to the transition', () => {
  const viewTransitions = createViewTransitions()

  viewTransitions.prepare(navigation(['slide']))
  viewTransitions.start(() => {})

  expect([...transitionOf(viewTransitions).types]).toEqual(['slide'])
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
  const viewTransitions = createViewTransitions()
  const { viewTransition, prepare, start } = viewTransitions

  prepare(navigation())
  start(() => {})

  const transition = transitionOf(viewTransitions)

  expect(viewTransition.transition).toBe(transition)

  await transition.finished
  await flushPromises()

  expect(viewTransition.isTransitioning).toBe(false)
  expect(viewTransition.transition).toBeUndefined()
})

test('a transition finishing does not clear a newer navigation that has since been prepared', async () => {
  const viewTransitions = createViewTransitions()
  const { viewTransition, prepare, start } = viewTransitions

  prepare(navigation())
  await start(() => {})

  const transition = transitionOf(viewTransitions)
  const newer = createResolvedRoute(createRoute({ name: 'newer', path: '/newer' }))

  prepare({ to: newer, from: to, types: [] })

  await transition.finished
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
