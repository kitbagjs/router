import { expect, test } from 'vitest'
import { createRejection } from '@/services/createRejection'
import { createRoute } from '@/services/createRoute'
import { getRoutesForRouter } from '@/services/getRoutesForRouter'
import { component } from '@/utilities/testHelpers'

test('given a status, stores it on the rejection', () => {
  const rejection = createRejection({ type: 'Unauthorized', status: 401 })

  expect(rejection.status).toBe(401)
})

test('given no status, leaves it undefined', () => {
  const rejection = createRejection({ type: 'Maintenance' })

  expect(rejection.status).toBeUndefined()
})

test('the built in NotFound rejection declares 404', () => {
  const { getRejectionByType } = getRoutesForRouter([createRoute({ name: 'route', path: '/', component })])

  expect(getRejectionByType('NotFound').status).toBe(404)
})
