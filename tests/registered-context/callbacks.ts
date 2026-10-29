import { expectTypeOf } from 'vitest'
import { createRoute, createExternalRoute, createRouter, createRouterAssets, createRouterPlugin, createHook, createLoader, createView, createRejection, type Hook } from '@kitbag/router'
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
const logout = createRoute({
  name: 'logout',
  path: '/logout',
  context: [extra, expired],
})
  .onBeforeRouteEnter(logoutHook)
const pluginRoute = createRoute({ name: 'plugin' })
const plugin = createRouterPlugin({ routes: [pluginRoute] })
export const router = createRouter([login, logout, user], { rejections: [denied] }, [plugin])

declare module '@kitbag/router' {
  interface Register {
    router: typeof router,
  }
}

logout.onAfterRouteEnter(contextHook)
logout.onBeforeRouteEnter((to, { from, replace, reject, update }) => {
  expectTypeOf(to.name).toEqualTypeOf<'logout'>()
  expectTypeOf(from?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | 'extra' | undefined>()
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
  expectTypeOf(to?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | 'extra' | undefined>()
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
    expectTypeOf(to?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | 'extra' | undefined>()
    expectTypeOf(from?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | 'extra' | undefined>()
    if (to?.name === 'extra') {
      expectTypeOf(to.params.slug).toEqualTypeOf<string>()
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
    expectTypeOf(route.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | 'extra'>()
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
    expectTypeOf(route.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | 'extra'>()
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
    expectTypeOf(to?.name).toEqualTypeOf<'other' | 'extra' | undefined>()
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
  expectTypeOf(from.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | 'extra'>()
  return to.name
})

assets.createLoader({
  context: [extra, expired],
  load: (route, { push, reject }) => {
    expectTypeOf(route.name).toEqualTypeOf<'other' | 'extra'>()
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
    expectTypeOf(route.name).toEqualTypeOf<'other' | 'extra'>()
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
