import { expectTypeOf } from 'vitest'
import { createRoute, createExternalRoute, createRouter, createRouterAssets, createRouterPlugin, createHook, createLoader, createView, createRejection, type Hook, type ResolvedRoute, type BeforeEnterHook } from '@kitbag/router'
import { defineComponent } from 'vue'

const component = defineComponent(() => () => null)
const denied = createRejection({ type: 'Denied' })
const expired = createRejection({ type: 'Expired' })
const extra = createRoute({
  name: 'extra',
  path: '/extra/[slug]',
})
const fallback = createRoute({
  name: 'fallback',
  path: '/fallback',
})
  .addView(component)
const fallbackHook: Hook<readonly [typeof fallback]> = createHook({
  context: [fallback],
  hook: (_to, { replace }) => {
    // @ts-expect-error explicit context must not widen route names
    replace('missing')
    return replace('fallback')
  },
})
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
const routes = [
  createRoute({
    name: 'login',
    path: '/login',
  })
    .addView(component),
  createRoute({
    name: 'logout',
    path: '/logout',
    context: [extra, expired],
  })
    .onBeforeRouteEnter(logoutHook)
    .onBeforeRouteUpdate(logoutHook)
    .onBeforeRouteLeave(logoutHook)
    .onAfterRouteEnter(fallbackHook)
    .onAfterRouteUpdate(logoutHook)
    .onAfterRouteLeave(logoutHook),
  createRoute({
    name: 'user',
    path: '/users/[id]',
  }),
] as const
const logout = routes[1]
const pluginRoute = createRoute({ name: 'plugin' })
const plugin = createRouterPlugin({ routes: [pluginRoute] })
export const router = createRouter(routes, { rejections: [denied] }, [plugin])

declare module '@kitbag/router' {
  interface Register {
    router: typeof router,
  }
}

logout.onAfterRouteEnter(contextHook)
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
logout.onAfterRouteLeave((to, { from, push }) => {
  expectTypeOf(from.name).toEqualTypeOf<'logout'>()
  expectTypeOf(to).toEqualTypeOf<ResolvedRoute | null>()
  push('plugin')
})
logout.addLoader((route, { push, reject }) => {
  expectTypeOf(route.name).toEqualTypeOf<'logout'>()
  push('login')
  push('extra', { slug: 'one' })
  reject('Denied')
  reject('Expired')
  return 123
})
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
createLoader({
  load: (route, { replace, reject }) => {
    expectTypeOf(route.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin'>()
    replace('login')
    reject('Denied')
    return true
  },
})
createView({
  component,
  props: (route, { push, reject }) => {
    expectTypeOf(route.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin'>()
    push('login')
    reject('Denied')
    return {}
  },
})

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

const other = createRoute({ name: 'other' })
const otherDenied = createRejection({ type: 'OtherDenied' })
const assets = createRouterAssets(createRouter([other], { rejections: [otherDenied] }))
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

logout.setTitle((to, { from }) => {
  expectTypeOf(to.name).toEqualTypeOf<'logout'>()
  expectTypeOf(from).toEqualTypeOf<ResolvedRoute>()
  return to.name
})

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

createHook({
  context: [],
  hook: (_to, { push, reject }) => {
    push('login')
    reject('Denied')
  },
})

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

for (const lifecycle of [
  'onBeforeRouteEnter',
  'onBeforeRouteUpdate',
  'onBeforeRouteLeave',
  'onAfterRouteEnter',
  'onAfterRouteUpdate',
  'onAfterRouteLeave',
] as const) {
  logout[lifecycle]((to, context) => {
    expectTypeOf(to).toEqualTypeOf<ResolvedRoute | null>()
    context.push('login')
    context.replace('extra', { slug: 'one' })
    context.reject('Denied')
    context.reject('Expired')
    // @ts-expect-error dynamically selected lifecycles still check route names
    context.push('missing')
    // @ts-expect-error dynamically selected lifecycles still check registered params
    context.push('user')
    // @ts-expect-error dynamically selected lifecycles still check context params
    context.replace('extra', { slug: 1 })
    // @ts-expect-error dynamically selected lifecycles still check rejection types
    context.reject('Missing')
    if (context.lifecycle === 'before') {
      context.abort()
    } else {
      // @ts-expect-error after callbacks cannot abort navigation
      context.abort()
    }
  })
}

const beforeOnly: BeforeEnterHook = (_to, { abort }) => abort()
// @ts-expect-error an after hook cannot require before-only context
logout.onAfterRouteEnter(beforeOnly)

const unmarkedHook = {
  hook: () => {},
  context: [],
}
// @ts-expect-error reusable hooks must carry the factory's marker
logout.onBeforeRouteEnter(unmarkedHook)
