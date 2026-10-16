import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRouterAssets } from '@/services/createRouterAssets'
import { createRouterPlugin } from '@/services/createRouterPlugin'
import { Router, RouterRoutes } from '@/types/router'
import { Routes } from '@/types/route'

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

test('an untyped router uses general route types', () => {
  expectTypeOf<RouterRoutes<Router>>().toEqualTypeOf<Routes>()
})
