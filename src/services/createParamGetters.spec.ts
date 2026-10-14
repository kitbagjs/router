import { expect, test } from 'vitest'
import { createParam } from '@/services/createParam'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { withParams } from '@/services/withParams'
import { withDefault } from '@/services/withDefault'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { literal } from '@/services/literal'
import { arrayOf } from '@/services/arrayOf'
import { tupleOf } from '@/services/tupleOf'
import { unionOf } from '@/services/unionOf'

test('param factory results can be looked up directly', () => {
  const status = literal('active')
  const ids = arrayOf([Number])
  const pair = tupleOf([Number, String])
  const owner = unionOf([Number, String])
  const limit = withDefault(Number, 10)
  const route = createRoute({
    name: 'search',
    path: '/search',
    query: withParams('status=[status]&ids=[ids]&pair=[pair]&owner=[owner]&limit=[?limit]', { status, ids, pair, owner, limit }),
  })
  const resolved = createResolvedRoute(route, route.parse('/search?status=active&ids=1,2&pair=3,name&owner=4'))

  expect(resolved.getParam(status)).toBe('active')
  expect(resolved.getParam(ids)).toEqual([1, 2])
  expect(resolved.getParam(pair)).toEqual([3, 'name'])
  expect(resolved.getParam(owner)).toBe(4)
  expect(resolved.getParam(limit)).toBe(10)
})

test('lookup matches definition identity across URL parts and skips absent values', () => {
  const userId = createParam(Number)
  const otherId = createParam(Number)
  const route = createRoute({
    name: 'users',
    path: withParams('/users/[?first]/[second]', { first: userId, second: userId }),
    query: withParams('owner=[?owner]', { owner: withDefault(userId, 3) }),
    hash: withParams('[last]', { last: userId }),
  })
  const resolved = createResolvedRoute(route, { second: 0, last: 4 })

  expect(resolved.getParam(userId)).toBe(0)
  expect(resolved.getAllParams(userId)).toEqual([0, 3, 4])
  expect(resolved.getParam(otherId)).toBeUndefined()
  expect(resolved.getAllParams(otherId)).toEqual([])
})

test('current route lookup follows navigation and definitions inherited from parents', async () => {
  const userId = createParam(Number)
  const parent = createRoute({ name: 'user', path: withParams('/users/[id]', { id: userId }) })
  const child = createRoute({ parent, name: 'settings', path: '/settings' })
  const other = createRoute({ name: 'other', path: withParams('/other/[owner]', { owner: userId }) })
  const router = createRouter([child, other], { initialUrl: '/users/1/settings' })
  const current = router.route

  await router.start()
  expect(current.getParam(userId)).toBe(1)
  await router.push('other', { owner: 2 })
  expect(current.getParam(userId)).toBe(2)
  expect(current.getAllParams(userId)).toEqual([2])
})

test('loader callbacks read tagged params when an alias uses a different name', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'user', path: withParams('/users/[id]', { id: userId }) })
    .addAlias({ path: '/people/[person]' }, ({ params }) => ({ id: Number(params.person) }))
    .addLoader((route) => route.getParam(userId))
  const router = createRouter([route], { initialUrl: '/people/1' })

  await router.start()
  await expect(router.route.data).resolves.toBe(1)
})
