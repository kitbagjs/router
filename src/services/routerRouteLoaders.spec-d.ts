import { expectTypeOf, test } from 'vitest'
import { createLoader, createRoute, createRouter, Loader } from '@/main'

test('route.loaders preserves the definition return and context types', () => {
  const target = createRoute({ name: 'target', path: '/target' })
  const reusable = createLoader({ context: [target], load: () => 'user' })
  const parent = createRoute({ name: 'parent' }).addLoader(async () => 42)
  const child = createRoute({ parent, name: 'child' }).addLoader(reusable, { name: 'user' })
  const router = createRouter([child])

  expectTypeOf(router.route.loaders.default).toEqualTypeOf<Loader<Promise<number>>>()
  expectTypeOf(router.route.loaders.user).toEqualTypeOf<typeof reusable>()
  // @ts-expect-error only declared loader names are available
  expectTypeOf(router.route.loaders.missing).toBeNever()
})
