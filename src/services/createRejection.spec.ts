import { createRouter } from '@/services/createRouter'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { expect, test, vi } from 'vitest'
import { createRejection } from '@/services/createRejection'
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
  const { getRejectionByType } = getRoutesForRouter([createRoute({ name: 'route', path: '/', component })])

  expect(getRejectionByType('NotFound').status).toBe(404)
})

test('rejections registered with routes are selected by name, not their current address', async () => {
  const home = createRoute({ name: 'home', path: '/home' })
  const denied = createRejection({ type: 'Denied' })
  const router = createRouter([home, denied], { initialUrl: '/home?next=account#details' })
  const title = vi.fn((to) => `${to.name}: ${to.href}`)

  denied.setTitle(title)

  await router.start()
  await router.push('Denied')

  expect(router.route).toMatchObject({ name: 'Denied', href: '/home?next=account#details', canonical: '/home?next=account#details' })
  expect(router.route.query.get('next')).toBe('account')
  expect(router.route.hash).toBe('#details')
  await expect(router.route.getTitle()).resolves.toBe('Denied: /home?next=account#details')
  expect(router.find('/home')?.name).toBe('home')

  const resolved = router.resolve('Denied')

  await router.push(resolved, { query: { reason: 'expired' }, hash: 'retry' })

  expect(router.route.href).toBe('/home?next=account&reason=expired#retry')
  await expect(router.route.getTitle()).resolves.toBe('Denied: /home?next=account&reason=expired#retry')

  await router.push('home')
  expect(router.route.name).toBe('home')
})

test('a rejection can override NotFound in the route list', async () => {
  const missing = createRejection({ type: 'NotFound', status: 410 }).addLoader(() => 'gone')
  const router = createRouter([missing], { initialUrl: '/missing', ssr: true })
  const result = await router.render()

  expect(result).toMatchObject({ kind: 'reject', status: 410, rejection: 'NotFound' })
  await expect(router.route.data).resolves.toBe('gone')

  if (result.kind !== 'reject') {
    throw new Error('Expected rejected render')
  }

  expect(result.payload).toContain('gone')
  expect(result.failures).toEqual([])
})

test('route and rejection names share the same namespace', () => {
  const route = createRoute({ name: 'Denied', path: '/' })
  const rejection = createRejection({ type: 'Denied' })

  expect(() => createRouter([route, rejection], { initialUrl: '/' })).toThrow(DuplicateNamesError)
})

test('an explicit rejection alias respects the base and only matches its own URL', async () => {
  const unavailable = createRejection({ type: 'Unavailable', status: 503 }).addAlias({ path: '/unavailable' })
  const home = createRoute({ name: 'home', path: '/home' })
  const router = createRouter([home, unavailable], { initialUrl: '/app/unavailable?reason=maintenance', base: '/app', ssr: true })

  expect(router.find('/app/home')?.name).toBe('home')
  expect(router.find('/other')).toBeUndefined()

  const result = await router.render()

  expect(result).toMatchObject({ kind: 'reject', status: 503, rejection: 'Unavailable' })
  expect(router.route).toMatchObject({ name: 'Unavailable', href: '/app/unavailable?reason=maintenance' })
})
