import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { insertBaseRoute } from '@/services/insertBaseRoute'
import { isRoute } from '@/types/route'

test.each([
  [undefined],
  [''],
])('given empty or undefined base, returns route unmodified', (base) => {
  const route = createRoute({ name: 'foo', path: '/foo' })

  const response = insertBaseRoute(route, base)

  expect(response).toMatchObject(route)
})

test('given value for base, returns route with base prefixed', () => {
  const base = '/kitbag'

  const route = createRoute({ name: 'foo', path: '/foo' })

  const response = insertBaseRoute(route, base)

  expect(response.stringify()).toBe('/kitbag/foo')
})

test('given value for base, prefixes the route aliases too', () => {
  const route = createRoute({ name: 'foo', path: '/foo' }).addAlias('/bar')

  const response = insertBaseRoute(route, '/kitbag')

  expect(isRoute(response) && response.aliases[0].url.stringify()).toBe('/kitbag/bar')
})
