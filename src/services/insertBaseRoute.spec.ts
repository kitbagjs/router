import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { insertBaseRoute } from '@/services/insertBaseRoute'

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

  expect(response.path.value).toBe('/kitbag/foo')
})
