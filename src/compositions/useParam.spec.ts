import { ComputedRef, createApp, effectScope, isReadonly } from 'vue'
import { assert, expect, onTestFinished, test } from 'vitest'
import { createParam, createRoute, createRouter, createRouterAssets, useParam, withDefault, withParams } from '@/main'

import { Router } from '@/types/router'

type Setup = {
  router: Router,
  value: ComputedRef<number | undefined>,
  values: ComputedRef<number[]>,
}

async function setup(source: 'global' | 'router assets' = 'global'): Promise<Setup> {
  const userId = createParam(Number)
  const defaultedId = withDefault(userId, 3)
  const users = createRoute({
    name: 'users',
    path: withParams('/users/[from]/[to]', { from: userId, to: userId }),
    query: withParams('owner=[?owner]', { owner: defaultedId }),
  })
  const other = createRoute({ name: 'other', path: '/other' })
  const router = createRouter([users, other], { initialUrl: '/users/1/2' })
  const scope = effectScope()

  onTestFinished(() => {
    scope.stop()
    router.stop()
  })

  await router.start()

  const app = createApp({})
  app.use(router)

  const useRouterParam = source === 'global' ? useParam : createRouterAssets(router).useParam
  const result = app.runWithContext(() => scope.run(() => useRouterParam(defaultedId)))
  assert(result)

  return { router, ...result }
}

test('value contains the first matching param', async () => {
  const { value } = await setup()

  expect(value.value).toBe(1)
})

test('values contains all matching params in schema order', async () => {
  const { values } = await setup()

  expect(values.value).toEqual([1, 2, 3])
})

test('destructured value follows navigation', async () => {
  const { router, value } = await setup()

  await router.push('users', { from: 0, to: 4, owner: 5 })

  expect(value.value).toBe(0)
})

test('destructured values follows navigation', async () => {
  const { router, values } = await setup()

  await router.push('users', { from: 0, to: 4, owner: 5 })

  expect(values.value).toEqual([0, 4, 5])
})

test('value is undefined when the current route does not use the definition', async () => {
  const { router, value } = await setup()

  await router.push('other')

  expect(value.value).toBeUndefined()
})

test('values is empty when the current route does not use the definition', async () => {
  const { router, values } = await setup()

  await router.push('other')

  expect(values.value).toEqual([])
})

test('value is a readonly ref', async () => {
  const { value } = await setup()

  expect(isReadonly(value)).toBe(true)
})

test('values is a readonly ref', async () => {
  const { values } = await setup()

  expect(isReadonly(values)).toBe(true)
})

test('router assets expose a working param hook', async () => {
  const { value, values } = await setup('router assets')

  expect(value.value).toBe(1)
  expect(values.value).toEqual([1, 2, 3])
})
