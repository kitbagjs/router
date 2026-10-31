import { expectTypeOf, test } from 'vitest'
import { createRejection, createRoute, createRouter, isResolvedRoute, Rejection, ResolvedRoute, RouterRoute } from '@/main'

test('title getters are not part of the public route and rejection types', () => {
  expectTypeOf<ResolvedRoute>().not.toHaveProperty('getTitle')
  expectTypeOf<RouterRoute>().not.toHaveProperty('getTitle')
  expectTypeOf<Rejection>().not.toHaveProperty('getTitle')

  const home = createRoute({ name: 'home', path: '/' })
  const rejection = createRejection({ type: 'Unauthorized' })
  const router = createRouter([home], { initialUrl: '/', rejections: [rejection] })

  expectTypeOf(home).not.toHaveProperty('getTitle')
  expectTypeOf(rejection).not.toHaveProperty('getTitle')
  expectTypeOf(router.resolve('home')).not.toHaveProperty('getTitle')
  expectTypeOf(router.route).not.toHaveProperty('getTitle')

  home.setTitle((route) => {
    expectTypeOf(route).not.toHaveProperty('getTitle')
    return 'Home'
  })

  home.onBeforeRouteEnter((route) => {
    expectTypeOf(route).not.toHaveProperty('getTitle')
  })
})

test('the public resolved route guard does not expose internal title getters', () => {
  const value: unknown = {}

  if (isResolvedRoute(value)) {
    expectTypeOf(value).not.toHaveProperty('getTitle')
    expectTypeOf(value).not.toHaveProperty('getRouteTitle')
    expectTypeOf(value.href).toBeString()
  }
})
