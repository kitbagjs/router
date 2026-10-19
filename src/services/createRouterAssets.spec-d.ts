import { expectTypeOf, test } from 'vitest'
import { onBeforeRouteUpdate } from '@/main'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRouterAssets } from '@/services/createRouterAssets'
import { createRouterPlugin } from '@/services/createRouterPlugin'
import { ResolvedRoute } from '@/types/resolved'

test('router assets include plugin routes in hook callbacks', () => {
  const home = createRoute({ name: 'home', path: '/' })
  const user = createRoute({ name: 'user', path: '/users/[id]' })
  const plugin = createRouterPlugin({ routes: [user] })
  const assets = createRouterAssets(createRouter([home], {}, [plugin]))

  assets.onBeforeRouteUpdate((route) => {
    expectTypeOf(route.name).toEqualTypeOf<'home' | 'user'>()

    if (route.name === 'user') {
      expectTypeOf(route.params.id).toEqualTypeOf<string>()
    }
  })
})

test('global hooks use general route types without registration', () => {
  onBeforeRouteUpdate((route) => {
    expectTypeOf(route).toEqualTypeOf<ResolvedRoute>()
    expectTypeOf(route.name).not.toBeAny()
    expectTypeOf(route.params.id).not.toBeAny()
  })
})

test('router assets accept plugin route names and retain their parameter types', () => {
  const home = createRoute({ name: 'home', path: '/' })
  const user = createRoute({ name: 'user', path: '/users/[id]' })
  const plugin = createRouterPlugin({ routes: [user] })
  const router = createRouter([home], {}, [plugin])
  const assets = createRouterAssets(router)

  expectTypeOf(assets.useRoute('user').params.id).toEqualTypeOf<string>()
  assets.useLink('user', { id: '1' })
  // @ts-expect-error plugin route params are still checked
  assets.useLink('user', { id: 1 })
  // @ts-expect-error unknown route names are still rejected
  assets.useRoute('missing')

  const route = router.route

  if (assets.isRoute(route, 'user', { exact: true })) {
    expectTypeOf(route.name).toEqualTypeOf<'user'>()
    expectTypeOf(route.params.id).toEqualTypeOf<string>()
  }
})
