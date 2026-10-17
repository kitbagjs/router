import { expectTypeOf, test } from 'vitest'
import { createLoader, createRoute, createRouter, createRouterAssets, LoaderResult, useLoader } from '@/main'

test('async definitions infer resolved data for reactive and awaited consumption', async () => {
  const loader = createLoader({ load: async () => ({ name: 'kitbag' }) })
  const result = useLoader(loader)

  expectTypeOf(result.data.value).toEqualTypeOf<{ name: string } | undefined>()
  expectTypeOf(await result).toEqualTypeOf<{ name: string }>()
})

test('router assets infer data from inline route definitions', () => {
  const route = createRoute({ name: 'home' }).addLoader(() => 42, { name: 'count' })
  const router = createRouter([route])
  const assets = createRouterAssets(router)

  expectTypeOf(assets.useLoader(router.route.loaders.count)).toEqualTypeOf<LoaderResult<number>>()
  // @ts-expect-error promises are data, not loader definitions
  assets.useLoader(router.route.data.count)
})
