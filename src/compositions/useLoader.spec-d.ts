import { expectTypeOf, test } from 'vitest'
import { createLoader, createRoute, createRouter, createRouterAssets, UseLoader, useLoader } from '@/main'

test('async definitions infer resolved data for reactive and awaited consumption', async () => {
  const loader = createLoader({ load: async () => ({ name: 'kitbag' }) })
  const result = useLoader(loader)

  expectTypeOf(result.data.value).toEqualTypeOf<{ name: string } | undefined>()
  const awaited = await result
  expectTypeOf(awaited).toEqualTypeOf<Omit<UseLoader<{ name: string }>, 'then'>>()
  expectTypeOf(awaited.loading.value).toEqualTypeOf<boolean>()
  // @ts-expect-error resolved state is not itself thenable
  expectTypeOf(awaited.then)
})

test('router assets infer data from inline route definitions', () => {
  const route = createRoute({ name: 'home' }).addLoader(() => 42, { name: 'count' })
  const router = createRouter([route])
  const assets = createRouterAssets(router)

  expectTypeOf(assets.useLoader(router.route.loaders.count)).toEqualTypeOf<UseLoader<number>>()
  // @ts-expect-error promises are data, not loader definitions
  assets.useLoader(router.route.data.count)
})
