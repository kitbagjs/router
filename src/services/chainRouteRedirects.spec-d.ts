import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createExternalRoute } from '@/services/createExternalRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'

test('redirect chains retain the receiving route and parameter inference', () => {
  const target = createRoute({ name: 'target', path: '/target/[id]' })
  const route = createRoute({ name: 'source', path: '/source/[id]' })
    .redirectTo(target, (params) => {
      expectTypeOf(params.id).toEqualTypeOf<string>()
      return { id: params.id }
    })
    .addView(component)
    .addLoader(() => 42)
    .onBeforeRouteEnter(() => {})
  const legacy = createRoute({ path: '/legacy/[id]' })

  expectTypeOf(route.redirectFrom(legacy, ({ id }) => ({ id }))).toEqualTypeOf(route)
  expectTypeOf(createRouter([route]).route.loaders.default.load).returns.toEqualTypeOf<number>()
  // @ts-expect-error target requires id
  route.redirectTo(target)
  // @ts-expect-error target id must be a string
  route.redirectTo(target, () => ({ id: 1 }))
})

test('external redirect chains retain their hooks and route types', () => {
  const target = createExternalRoute({ host: 'https://example.com', name: 'target', path: '/[id]' })
  const route = createExternalRoute({ host: 'https://example.com', name: 'source', path: '/source/[id]' })
    .redirectTo(target, ({ id }) => ({ id }))
    .onBeforeRouteEnter(() => {})

  expectTypeOf(route.name).toEqualTypeOf<'source'>()
  expectTypeOf(route.redirectTo(target, ({ id }) => ({ id }))).toEqualTypeOf(route)
})
