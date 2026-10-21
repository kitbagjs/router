import { createApp, effectScope, isReadonly } from 'vue'
import { assert, expect, test } from 'vitest'
import { createParam, createRoute, createRouter, createRouterAssets, useParam, withDefault, withParams } from '@/main'

test.each(['global', 'router assets'] as const)('%s param refs follow navigation after destructuring', async (source) => {
  const userId = createParam(Number)
  const defaultedId = withDefault(userId, 3)
  const users = createRoute({
    name: 'users',
    path: withParams('/users/[from]/[to]', { from: userId, to: userId }),
    query: withParams('owner=[?owner]', { owner: defaultedId }),
  })
  const other = createRoute({ name: 'other', path: '/other' })
  const router = createRouter([users, other], { initialUrl: '/users/1/2' })
  const useRouterParam = source === 'global' ? useParam : createRouterAssets(router).useParam

  await router.start()

  const app = createApp({})
  app.use(router)

  const scope = effectScope()
  const result = app.runWithContext(() => scope.run(() => useRouterParam(defaultedId)))
  assert(result)

  const { value, values } = result

  expect(isReadonly(value)).toBe(true)
  expect(isReadonly(values)).toBe(true)

  expect(value.value).toBe(1)
  expect(values.value).toEqual([1, 2, 3])

  await router.push('users', { from: 0, to: 4, owner: 5 })

  expect(value.value).toBe(0)
  expect(values.value).toEqual([0, 4, 5])

  await router.push('other')

  expect(value.value).toBeUndefined()
  expect(values.value).toEqual([])

  await router.push('users', { from: 6, to: 7 })

  expect(value.value).toBe(6)
  expect(values.value).toEqual([6, 7, 3])

  scope.stop()
  router.stop()
})
