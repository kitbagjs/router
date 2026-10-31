import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createExternalRoute } from '@/services/createExternalRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'

test('hooks preserve route, loader, and view types through a chain', () => {
  const route = createRoute({ name: 'user', path: '/users/[id]' })
    .onBeforeRouteEnter((to, { remove }) => {
      expectTypeOf(to.params.id).toEqualTypeOf<string>()
      expectTypeOf(remove).toEqualTypeOf<() => void>()
    })
    .addView(component)
    .addLoader(() => 42)
    .onBeforeRouteUpdate(() => {})
    .onBeforeRouteLeave(() => {})
    .onAfterRouteEnter(() => {})
    .onAfterRouteUpdate(() => {})
    .onAfterRouteLeave(() => {})
  const router = createRouter([route])

  expectTypeOf(router.route.name).toEqualTypeOf<'user'>()
  expectTypeOf(router.route.params.id).toEqualTypeOf<string>()
  expectTypeOf(router.route.loaders.default.load).returns.toEqualTypeOf<number>()
  expectTypeOf(route.onBeforeRouteEnter(() => {})).toEqualTypeOf(route)
})

test('external hooks preserve route types', () => {
  const route = createExternalRoute({ host: 'https://example.com', name: 'user', path: '/[id]' })
    .onBeforeRouteEnter((to) => {
      expectTypeOf(to.params.id).toEqualTypeOf<string>()
    })

  expectTypeOf(route.name).toEqualTypeOf<'user'>()
  expectTypeOf(route.onBeforeRouteEnter(() => {})).toEqualTypeOf(route)
})
