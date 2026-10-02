import { flushPromises } from '@vue/test-utils'
import { afterEach, expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import * as routerHistory from '@/services/createRouterHistory'
import { component } from '@/utilities/testHelpers'

const createHistory = routerHistory.createRouterHistory

afterEach(() => vi.restoreAllMocks())

function setup(): { router: ReturnType<typeof createRouter>, history: ReturnType<typeof createHistory> } {
  const spy = vi.spyOn(routerHistory, 'createRouterHistory').mockImplementationOnce(createHistory)
  const home = createRoute({ name: 'home', path: '/', component })
  const first = createRoute({ name: 'first', path: '/first', component })
  const second = createRoute({ name: 'second', path: '/second', component })
  const third = createRoute({ name: 'third', path: '/third', component })
  const router = createRouter([home, first, second, third], { initialUrl: '/', historyMode: 'memory' })
  const history = spy.mock.results[0].value as ReturnType<typeof createHistory>

  return { router, history }
}

test('aborting Back restores the entry without running hooks again', async () => {
  const { router, history } = setup()
  await router.start()
  await router.push('first')
  await router.push('second')
  const entry = history.location
  const before = vi.fn()
  const after = vi.fn()
  router.onBeforeRouteEnter((_to, { abort }) => {
    before()
    abort()
  })
  router.onAfterRouteEnter(after)

  router.back()
  await flushPromises()

  expect(router.route.name).toBe('second')
  expect(history.location).toBe(entry)
  expect(before).toHaveBeenCalledOnce()
  expect(after).not.toHaveBeenCalled()
  router.stop()
})

test('aborting Forward preserves both entries and allows a later traversal', async () => {
  const { router, history } = setup()
  await router.start()
  await router.push('first')
  const first = history.location
  await router.push('second')
  const second = history.location
  router.back()
  await flushPromises()
  expect(history.location).toBe(first)
  let blocked = true
  router.onBeforeRouteEnter((_to, { abort }) => {
    if (blocked) {
      abort()
    }
  })

  router.forward()
  await flushPromises()
  expect(router.route.name).toBe('first')
  expect(history.location).toBe(first)

  blocked = false
  router.forward()
  await flushPromises()
  expect(router.route.name).toBe('second')
  expect(history.location).toBe(second)
  router.stop()
})

test('a delayed abort does not roll back a newer successful push', async () => {
  const { router, history } = setup()
  await router.start()
  await router.push('first')
  await router.push('second')
  const waiting = Promise.withResolvers<string>()
  router.onBeforeRouteEnter(async (to, { abort }) => {
    if (to.name === 'first') {
      await waiting.promise
      abort()
    }
  })

  router.back()
  await flushPromises()
  await router.push('third')
  const entry = history.location
  waiting.resolve('continue')
  await flushPromises()

  expect(router.route.name).toBe('third')
  expect(history.location).toBe(entry)
  router.stop()
})

test('a multi-entry aborted traversal returns to the original entry', async () => {
  const { router, history } = setup()
  await router.start()
  await router.push('first')
  await router.push('second')
  await router.push('third')
  const entry = history.location
  router.onBeforeRouteEnter((_to, { abort }) => abort())

  router.go(-3)
  await flushPromises()

  expect(router.route.name).toBe('third')
  expect(history.location).toBe(entry)
  router.stop()
})

test('an aborted traversal between identical URLs restores the original state and key', async () => {
  const { router, history } = setup()
  await router.start()
  await router.push('/first', { state: { visit: 'first' } })
  const first = history.location
  await router.push('/first', { state: { visit: 'second' } })
  const second = history.location
  let blocked = true
  router.onBeforeRouteUpdate((_to, { abort }) => {
    if (blocked) {
      abort()
    }
  })

  router.back()
  await flushPromises()
  expect(history.location).toBe(second)
  expect(history.location.state).toEqual({ visit: 'second' })

  blocked = false
  router.back()
  await flushPromises()
  expect(history.location).toBe(first)
  expect(history.location.state).toEqual({ visit: 'first' })
  router.stop()
})
