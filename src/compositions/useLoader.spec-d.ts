import { expectTypeOf, test } from 'vitest'
import { createLoader, createRoute, createRouter, createRouterAssets, LoaderResult, useLoader } from '@/main'

test('imported and route definitions return reactive and awaitable resolved data', async () => {
  const loader = createLoader({ load: async () => ({ name: 'kitbag' }) })
  const route = createRoute({ name: 'home' }).addLoader(loader, { name: 'user' })
  const router = createRouter([route])
  const assets = createRouterAssets(router)
  const definition = useLoader(loader)
  const attached = assets.useLoader(router.route.loaders.user)

  expectTypeOf(definition).toEqualTypeOf<LoaderResult<{ name: string }>>()
  expectTypeOf(attached).toEqualTypeOf<typeof definition>()
  expectTypeOf(definition.data.value).toEqualTypeOf<{ name: string } | undefined>()
  expectTypeOf(await definition).toEqualTypeOf<{ name: string }>()
  // @ts-expect-error promises are data, not loader definitions
  useLoader(router.route.data.user)
})
