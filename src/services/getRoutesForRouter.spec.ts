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
