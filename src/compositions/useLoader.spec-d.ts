import { expectTypeOf, test } from 'vitest'
import { createLoader, createRoute, createRouter, createRouterAssets, LoaderResult, useLoader } from '@/main'

test('definitions and handles return reactive and awaitable resolved data', async () => {
  const loader = createLoader({ load: async () => ({ name: 'kitbag' }) })
  const route = createRoute({ name: 'home' }).addLoader(loader, { name: 'user' })
  const router = createRouter([route])
  const assets = createRouterAssets(router)
  const definition = useLoader(loader)
  const handle = assets.useLoader(router.route.loaders.user)

  expectTypeOf(definition).toEqualTypeOf<LoaderResult<{ name: string }>>()
  expectTypeOf(handle).toEqualTypeOf<typeof definition>()
  expectTypeOf(definition.data.value).toEqualTypeOf<{ name: string } | undefined>()
  expectTypeOf(await definition).toEqualTypeOf<{ name: string }>()
  // @ts-expect-error promises are data, not loader definitions or handles
  useLoader(router.route.data.user)
})
