import { expect, test } from 'vitest'
import { createParam } from '@/services/createParam'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { withParams } from '@/services/withParams'
import { withDefault } from '@/services/withDefault'
import { createResolvedRoute } from '@/services/createResolvedRoute'

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
