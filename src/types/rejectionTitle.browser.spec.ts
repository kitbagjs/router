import { expect, test, vi } from 'vitest'
import { createRejection } from '@/services/createRejection'
import { component, routes } from '@/utilities/testHelpers'
import { createRouter } from '@/services/createRouter'
import { createRoute } from '@/services/createRoute'
import { flushPromises } from '@vue/test-utils'

test('rejection with title updates document title', async () => {
  const rejection = createRejection({ type: 'CustomRejection' })

  const title = 'foo'
  const callback = vi.fn(() => title)

  rejection.setTitle(callback)

  const router = createRouter(routes, {
    initialUrl: '/',
    rejections: [rejection],
  })

  await router.start()

  await flushPromises()

  expect(callback).toHaveBeenCalledTimes(0)
  expect(document.title).toBe('')

  router.reject('CustomRejection')

  await flushPromises()

  expect(callback).toHaveBeenCalledTimes(1)
  expect(document.title).toBe(title)
})

test('route with title and rejection with title updates document title in correct order', async () => {
  const rejectionTitle = 'rejection title'
  const rejectionTitleCallback = vi.fn(() => rejectionTitle)
  const rejection = createRejection({ type: 'CustomRejection' })

  rejection.setTitle(rejectionTitleCallback)

  const routeTitle = 'route title'
  const route = createRoute({
    name: 'target',
    path: '/',
    context: [rejection],
    component,
  })

  route.setTitle(() => routeTitle)

  route.onBeforeRouteEnter((_to, { reject }) => {
    throw reject('CustomRejection')
  })

  const router = createRouter([route], {
    initialUrl: '/',
  })

  await router.start()

  await flushPromises()

  expect(rejectionTitleCallback).toHaveBeenCalledTimes(1)
  expect(document.title).toBe(rejectionTitle)
})
