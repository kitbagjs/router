import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { getRoutesForRouter } from '@/services/getRoutesForRouter'
import { component } from '@/utilities'

test('given routes without names, removes routes from response', () => {
  const routes = [
    createRoute({ component, name: '' }),
    createRoute({ component, name: undefined }),
    createRoute({ component }),
  ]

  const response = getRoutesForRouter(routes)

  expect(response).toHaveLength(0)
})

test('always returns routes returned by discoverMissingRoutes', () => {
  const missingRoute = createRoute({ name: 'missing' })
  const routes = [
    createRoute({ name: 'foo', context: [missingRoute] }),
    createRoute({ name: 'bar', context: [missingRoute] }),
    createRoute({ name: 'zoo', context: [missingRoute] }),
  ]

  const response = getRoutesForRouter(routes)

  expect(response).toMatchObject([...routes, missingRoute])
})
