import { expectTypeOf, test } from 'vitest'
import { createRoute, createRouter, LoaderHandle } from '@/main'

test('handles preserve inherited and unnamed loader result types', () => {
  const parent = createRoute({ name: 'parent' }).addLoader(async () => 42)
  const child = createRoute({ parent, name: 'child' })
    .addLoader(() => 'user', { name: 'user' })
  const router = createRouter([child])

  expectTypeOf(router.route.loaders.default).toEqualTypeOf<LoaderHandle<number>>()
  expectTypeOf(router.route.loaders.user).toEqualTypeOf<LoaderHandle<string>>()
  // @ts-expect-error only declared loader names are available
  expectTypeOf(router.route.loaders.missing).toBeNever()
})
