import { expectTypeOf, test } from 'vitest'
import { createRoute, createExternalRoute, createRouter, createRouterAssets, createRouterPlugin, createHook, createLoader, createView, createRejection, type Hook, type ResolvedRoute } from '@kitbag/router'
import { defineComponent } from 'vue'

const component = defineComponent(() => () => null)
const denied = createRejection({ type: 'Denied' })
const expired = createRejection({ type: 'Expired' })
const extra = createRoute({
  name: 'extra',
  path: '/extra/[slug]',
})
const login = createRoute({
  name: 'login',
  path: '/login',
})
const user = createRoute({
  name: 'user',
  path: '/users/[id]',
})
const logout = createRoute({
  name: 'logout',
  path: '/logout',
  context: [extra, expired],
})
const pluginRoute = createRoute({ name: 'plugin' })
const plugin = createRouterPlugin({ routes: [pluginRoute] })
export const router = createRouter([login, logout, user], { rejections: [denied] }, [plugin])

declare module '@kitbag/router' {
  interface Register {
    router: typeof router,
  }
}

const other = createRoute({ name: 'other' })
const otherDenied = createRejection({ type: 'OtherDenied' })
const assets = createRouterAssets(createRouter([other], { rejections: [otherDenied] }))

test('annotated hooks retain registered routes and rejections', () => {
  const logoutHook: Hook = createHook({
    hook: (to, { from, replace, reject }) => {
      expectTypeOf(to?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | undefined>()
      expectTypeOf(from?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | undefined>()
      reject('Denied')
      // @ts-expect-error annotating the hook must not widen route names
      replace('missing')
      // @ts-expect-error annotating the hook must not widen rejection types
      reject('Missing')
      return replace('login')
    },
  })

  logout.onBeforeRouteEnter(logoutHook)
})

test('annotated hook context retains required params', () => {
  const contextHook: Hook<readonly [typeof extra, typeof expired]> = createHook({
    context: [extra, expired],
    hook: (_to, { push, reject }) => {
      push('login')
      push('extra', { slug: 'one' })
      reject('Denied')
      reject('Expired')
      // @ts-expect-error an annotated context retains its required params
      push('extra')
    },
  })

  logout.onAfterRouteEnter(contextHook)
})

test('route enter hooks combine registration with local context', () => {
  logout.onBeforeRouteEnter((to, { from, replace, reject, update }) => {
    expectTypeOf(to.name).toEqualTypeOf<'logout'>()
    expectTypeOf(from).toEqualTypeOf<ResolvedRoute | null>()
    expectTypeOf(update).toBeCallableWith({})
    reject('Denied')
    reject('Expired')
    replace('extra', { slug: 'one' })
    // @ts-expect-error registered params are required
    replace('user')
    // @ts-expect-error context params retain their types
    replace('extra', { slug: 1 })
    // @ts-expect-error unknown rejection
    reject('Missing')
    return replace('login')
  })
})

test('route leave hooks retain the source route and plugin routes', () => {
  logout.onAfterRouteLeave((to, { from, push }) => {
    expectTypeOf(from.name).toEqualTypeOf<'logout'>()
    expectTypeOf(to).toEqualTypeOf<ResolvedRoute | null>()
    push('plugin')
  })
})

test('route loaders combine registration with local context', () => {
  logout.addLoader((route, { push, reject }) => {
    expectTypeOf(route.name).toEqualTypeOf<'logout'>()
    push('login')
    push('extra', { slug: 'one' })
    reject('Denied')
    reject('Expired')
    return 123
  })
})

test('route views combine registration with local context', () => {
  logout.addView(component, {
    props: (route, { replace, reject }) => {
      expectTypeOf(route.name).toEqualTypeOf<'logout'>()
      replace('login')
      replace('extra', { slug: 'one' })
      reject('Denied')
      reject('Expired')
      return {}
    },
  })
})

test('standalone hooks infer registered routes and rejections', () => {
  createHook({
    hook: (to, { from, push, reject }) => {
      expectTypeOf(to?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | undefined>()
      expectTypeOf(from?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | undefined>()
      push('login')
      push('user', { id: '1' })
      reject('Denied')
      // @ts-expect-error unknown route
      push('missing')
      // @ts-expect-error unknown rejection
      reject('Missing')
    },
  })
})

test('standalone loaders infer registered routes and rejections', () => {
  createLoader({
    load: (route, { replace, reject }) => {
      expectTypeOf(route.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin'>()
      replace('login')
      reject('Denied')
      return true
    },
  })
})

test('standalone views infer registered routes and rejections', () => {
  createView({
    component,
    props: (route, { push, reject }) => {
      expectTypeOf(route.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin'>()
      push('login')
      reject('Denied')
      return {}
    },
  })
})

test('hook context extends helpers without widening callback routes', () => {
  createHook({
    context: [extra, expired],
    hook: (to, { from, push, reject }) => {
      expectTypeOf(to?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | undefined>()
      expectTypeOf(from?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | undefined>()
      if (to?.name === 'user') {
        expectTypeOf(to.params.id).toEqualTypeOf<string>()
      }
      push('login')
      push('extra', { slug: 'one' })
      reject('Denied')
      reject('Expired')
      // @ts-expect-error context params are required
      push('extra')
    },
  })
})

test('loader context extends helpers without widening callback routes', () => {
  createLoader({
    context: [extra, expired],
    load: (route, { replace, reject }) => {
      expectTypeOf(route.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin'>()
      replace('login')
      replace('extra', { slug: 'one' })
      reject('Denied')
      reject('Expired')
      return true
    },
  })
})

test('view context extends helpers without widening callback routes', () => {
  createView({
    component,
    context: [extra, expired],
    props: (route, { push, reject }) => {
      expectTypeOf(route.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin'>()
      push('login')
      push('extra', { slug: 'one' })
      reject('Denied')
      reject('Expired')
      return {}
    },
  })
})

test('router asset hooks use their own router instead of global registration', () => {
  assets.createHook({
    context: [extra, expired],
    hook: (to, { push, reject }) => {
      expectTypeOf(to?.name).toEqualTypeOf<'other' | undefined>()
      push('other')
      reject('OtherDenied')
      push('extra', { slug: 'one' })
      reject('Expired')
      // @ts-expect-error a specific router does not inherit global registration
      push('login')
      // @ts-expect-error a specific router does not inherit global rejections
      reject('Denied')
    },
  })
})

test('route title callbacks retain the route and registered source', () => {
  logout.setTitle((to, { from }) => {
    expectTypeOf(to.name).toEqualTypeOf<'logout'>()
    expectTypeOf(from).toEqualTypeOf<ResolvedRoute>()
    return to.name
  })
})

test('router asset loaders use their own router instead of global registration', () => {
  assets.createLoader({
    context: [extra, expired],
    load: (route, { push, reject }) => {
      expectTypeOf(route.name).toEqualTypeOf<'other'>()
      push('other')
      reject('OtherDenied')
      reject('Expired')
      // @ts-expect-error a specific router does not inherit global registration
      push('login')
      // @ts-expect-error a specific router does not inherit global rejections
      reject('Denied')
      return true
    },
  })
})

test('router asset views use their own router instead of global registration', () => {
  assets.createView({
    component,
    context: [extra, expired],
    props: (route, { push, reject }) => {
      expectTypeOf(route.name).toEqualTypeOf<'other'>()
      push('other')
      reject('OtherDenied')
      reject('Expired')
      // @ts-expect-error a specific router does not inherit global registration
      push('login')
      // @ts-expect-error a specific router does not inherit global rejections
      reject('Denied')
      return {}
    },
  })
})

test('empty hook context retains registered helpers', () => {
  createHook({
    context: [],
    hook: (_to, { push, reject }) => {
      push('login')
      reject('Denied')
    },
  })
})

test('external route hooks infer registered helpers without context', () => {
  const external = createExternalRoute({
    name: 'external',
    host: 'https://example.com',
  })
  external.onBeforeRouteEnter((to, { push, reject }) => {
    expectTypeOf(to.name).toEqualTypeOf<'external'>()
    push('login')
    reject('Denied')
    // @ts-expect-error an omitted external context must not widen route names
    push('missing')
    // @ts-expect-error an omitted external context must not widen rejection types
    reject('Missing')
  })
})

test('external route hooks combine registration with local context', () => {
  const externalWithContext = createExternalRoute({
    name: 'externalWithContext',
    host: 'https://example.com',
    context: [extra, expired],
  })
  externalWithContext.onBeforeRouteEnter((_to, { push, reject }) => {
    push('login')
    push('extra', { slug: 'one' })
    reject('Denied')
    reject('Expired')
  })
})
