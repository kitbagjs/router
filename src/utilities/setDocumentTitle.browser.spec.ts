import { expect, test, vi } from 'vitest'
import { setDocumentTitle } from '@/utilities/setDocumentTitle'
import { createRejection } from '@/services/createRejection'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { flushPromises } from '@vue/test-utils'

test('when called with rejection, only calls getTitle on rejection', async () => {
  const rejectionSetTitleCallback = vi.fn(() => 'Rejection Title')
  const rejection = createRejection({ type: 'CustomRejection' })
  rejection.setTitle(rejectionSetTitleCallback)

  const routeTo = createRoute({ name: 'to' })
  const to = createResolvedRoute(routeTo)

  const routeFrom = createRoute({ name: 'from' })
  const from = createResolvedRoute(routeFrom)

  setDocumentTitle({ to, from, rejection })

  await flushPromises()

  expect(rejectionSetTitleCallback).toHaveBeenCalledTimes(1)
  expect(rejectionSetTitleCallback).toHaveBeenCalledWith({ to, from })
  expect(document.title).toBe('Rejection Title')
})

test('when called with to route, uses existing title on resolved', async () => {
  const routeSetTitleCallback = vi.fn(() => 'Route Title')
  const route = createRoute({ name: 'to' })
  route.setTitle(routeSetTitleCallback)

  const to = createResolvedRoute(route)

  await flushPromises()

  expect(routeSetTitleCallback).toHaveBeenCalledTimes(1)

  setDocumentTitle({ to })

  await flushPromises()

  expect(document.title).toBe('Route Title')
})
