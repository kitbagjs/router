import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { insertBaseRoute } from '@/services/insertBaseRoute'

test.each([
  [undefined],
  [''],
])('given empty or undefined base, returns routes unmodified', (base) => {
  const parent = createRoute({ name: 'c', path: '/c' })
  const routes = [
    createRoute({ name: 'a', path: '/a' }),
    createRoute({ name: 'b', path: '/b' }),
    parent,
    createRoute({ parent, name: 'd', path: '/d' }),
    createRoute({ parent, name: 'e', path: '/e' }),
    createRoute({ parent, name: 'f', path: '/f' }),
  ]

  const response = insertBaseRoute(routes, base)

  expect(response).toMatchObject(routes)
})

test('given value for base, returns routes with base prefixed', () => {
  const base = '/kitbag'
  const parent = createRoute({ name: 'c', path: '/c' })
  const routes = [
    createRoute({ name: 'a', path: '/a' }),
    createRoute({ name: 'b', path: '/b' }),
    parent,
    createRoute({ parent, name: 'd', path: '/d' }),
    createRoute({ parent, name: 'e', path: '/e' }),
    createRoute({ parent, name: 'f', path: '/f' }),
  ]

  const response = insertBaseRoute(routes, base)

  expect(response.every(route => route.path.toString().startsWith('/kitbag'))).toBe(true)
})