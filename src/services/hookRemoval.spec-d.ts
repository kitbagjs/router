import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRouterAssets } from '@/services/createRouterAssets'
import { createRouterPlugin } from '@/services/createRouterPlugin'
import { createHook } from '@/services/createHook'
import { createRejection } from '@/services/createRejection'

test('remove is available in inline and reusable hook contexts', () => {
  const route = createRoute({ name: 'home', path: '/' })
  const router = createRouter([route])
  const plugin = createRouterPlugin({ routes: [route] })
  const assets = createRouterAssets(router)

  route.onBeforeRouteEnter((_to, { remove }) => {
    expectTypeOf(remove).toEqualTypeOf<() => void>()
  })
  route.onAfterRouteEnter((_to, { remove }) => {
    expectTypeOf(remove).toEqualTypeOf<() => void>()
  })
  router.onBeforeRouteEnter((_to, { remove }) => {
    expectTypeOf(remove).toEqualTypeOf<() => void>()
  })
  assets.onBeforeRouteLeave((_to, { remove }) => {
    expectTypeOf(remove).toEqualTypeOf<() => void>()
  })
  plugin.onAfterRouteUpdate((_to, { remove }) => {
    expectTypeOf(remove).toEqualTypeOf<() => void>()
  })
  createHook({
    hook: (_to, { remove }) => {
      expectTypeOf(remove).toEqualTypeOf<() => void>()
    },
  })
  router.onError((_error, { remove }) => {
    expectTypeOf(remove).toEqualTypeOf<() => void>()
  })
  router.onRejection((_rejection, { remove }) => {
    expectTypeOf(remove).toEqualTypeOf<() => void>()
  })
  createRejection({ type: 'Denied' }).onRejection((_rejection, { remove }) => {
    expectTypeOf(remove).toEqualTypeOf<() => void>()
  })
})
