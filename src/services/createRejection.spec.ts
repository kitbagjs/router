import { expect, test, vi } from 'vitest'
import { createRejection } from '@/services/createRejection'
import { createRouter } from '@/services/createRouter'
import { createRoute } from '@/services/createRoute'
import { getRoutesForRouter } from '@/services/getRoutesForRouter'
import { component } from '@/utilities/testHelpers'

test('given a status, stores it on the rejection', () => {
  const rejection = createRejection({ type: 'Unauthorized', status: 401 })

  expect(rejection.status).toBe(401)
})

test('stores whatever status was given', () => {
  const rejection = createRejection({ type: 'Maintenance', status: 503 })

  expect(rejection.status).toBe(503)
})

test('the built in NotFound rejection declares 404', () => {
  const { getRejectionByType } = getRoutesForRouter([createRoute({ name: 'route', path: '/' }).addView(component)])

  expect(getRejectionByType('NotFound').status).toBe(404)
})

test.each([{ name: 'Denied' }, { type: 'Denied' }])('rejects and renders definitions created with %j', async (options) => {
  const denied = createRejection({ ...options, status: 403 })
  const onRejection = vi.fn()
  const router = createRouter([], { initialUrl: '/', ssr: true, rejections: [denied] })
  router.onRejection(onRejection)
  await router.start()
  router.reject('Denied')
  const response = await router.render()

  expect(denied.name).toBe('Denied')
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- The alias remains backwards compatible.
  expect(denied.type).toBe('Denied')
  expect(onRejection).toHaveBeenLastCalledWith('Denied', expect.anything())
  expect(response).toMatchObject({ kind: 'reject', rejection: 'Denied', status: 403 })
  router.stop()
})
