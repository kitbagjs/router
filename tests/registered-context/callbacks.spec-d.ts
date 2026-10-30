import { expectTypeOf, test } from 'vitest'
import {
  createExternalRoute,
  createHook,
  createLoader,
  createRejection,
  createRoute,
  createRouter,
  createRouterAssets,
  createRouterPlugin,
  createView,
  type Hook,
  type ResolvedRoute,
} from '@kitbag/router'
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

test('Hook annotations preserve registered callback routes', () => {
  const logoutHook: Hook = createHook({
    hook: (to, { from, replace, reject }) => {
      expectTypeOf(to?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | undefined>()
      expectTypeOf(from?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | undefined>()
      // @ts-expect-error registered routes are not navigation context
      replace('login')
      // @ts-expect-error registered rejections are not navigation context
      reject('Denied')
    },
  })

  logout.onBeforeRouteEnter(logoutHook)
})

test('Hook context annotations preserve required params', () => {
  const contextHook: Hook<readonly [typeof extra, typeof expired]> = createHook({
    context: [extra, expired],
    hook: (_to, { push, reject }) => {
      push('extra', { slug: 'one' })
      reject('Expired')
      // @ts-expect-error an annotated context retains its required params
      push('extra')
      // @ts-expect-error an annotated context retains its param types
      push('extra', { slug: 1 })
    },
  })

  logout.onAfterRouteEnter(contextHook)
})

test('onBeforeRouteEnter preserves callback route types', () => {
  logout.onBeforeRouteEnter((to, { from }) => {
    expectTypeOf(to.name).toEqualTypeOf<'logout'>()
    expectTypeOf(from).toEqualTypeOf<ResolvedRoute | null>()
  })
})

test('onBeforeRouteEnter uses declared navigation context', () => {
  logout.onBeforeRouteEnter((_to, { replace, reject }) => {
    reject('Expired')
    replace('extra', { slug: 'one' })
    // @ts-expect-error registered routes are not navigation context
    replace('login')
    // @ts-expect-error registered rejections are not navigation context
    reject('Denied')
  })
})

test('onAfterRouteLeave preserves callback route types', () => {
  logout.onAfterRouteLeave((to, { from }) => {
    expectTypeOf(from.name).toEqualTypeOf<'logout'>()
    expectTypeOf(to).toEqualTypeOf<ResolvedRoute | null>()
  })
})

test('addLoader uses declared navigation context', () => {
  logout.addLoader((route, { push, reject }) => {
    expectTypeOf(route.name).toEqualTypeOf<'logout'>()
    push('extra', { slug: 'one' })
    reject('Expired')
    // @ts-expect-error registered routes are not navigation context
    push('login')
    // @ts-expect-error registered rejections are not navigation context
    reject('Denied')
    return 123
  })
})

test('addView uses declared navigation context', () => {
  logout.addView(component, {
    props: (route, { replace, reject }) => {
      expectTypeOf(route.name).toEqualTypeOf<'logout'>()
      replace('extra', { slug: 'one' })
      reject('Expired')
      // @ts-expect-error registered routes are not navigation context
      replace('login')
      // @ts-expect-error registered rejections are not navigation context
      reject('Denied')
      return {}
    },
  })
})

test('createHook infers registered callback routes', () => {
  createHook({
    hook: (to, { from }) => {
      expectTypeOf(to?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | undefined>()
      expectTypeOf(from?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | undefined>()
      if (to?.name === 'user') {
        expectTypeOf(to.params.id).toEqualTypeOf<string>()
      }
    },
  })
})

test('createLoader infers registered callback routes', () => {
  createLoader({
    load: (route) => {
      expectTypeOf(route.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin'>()
      return true
    },
  })
})

test('createView infers registered callback routes', () => {
  createView({
    component,
    props: (route) => {
      expectTypeOf(route.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin'>()
      return {}
    },
  })
})

test('createHook uses declared navigation context', () => {
  createHook({
    context: [extra, expired],
    hook: (to, { from, push, reject }) => {
      expectTypeOf(to?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | undefined>()
      expectTypeOf(from?.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin' | undefined>()
      push('extra', { slug: 'one' })
      reject('Expired')
      // @ts-expect-error registered routes are not navigation context
      push('login')
      // @ts-expect-error registered rejections are not navigation context
      reject('Denied')
    },
  })
})

test('createLoader uses declared navigation context', () => {
  createLoader({
    context: [extra, expired],
    load: (route, { replace, reject }) => {
      expectTypeOf(route.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin'>()
      replace('extra', { slug: 'one' })
      reject('Expired')
      // @ts-expect-error registered routes are not navigation context
      replace('login')
      // @ts-expect-error registered rejections are not navigation context
      reject('Denied')
      return true
    },
  })
})

test('createView uses declared navigation context', () => {
  createView({
    component,
    context: [extra, expired],
    props: (route, { push, reject }) => {
      expectTypeOf(route.name).toEqualTypeOf<'login' | 'logout' | 'user' | 'plugin'>()
      push('extra', { slug: 'one' })
      reject('Expired')
      // @ts-expect-error registered routes are not navigation context
      push('login')
      // @ts-expect-error registered rejections are not navigation context
      reject('Denied')
      return {}
    },
  })
})

test('assets.createHook uses its router types', () => {
  assets.createHook({
    context: [extra, expired],
    hook: (to, { push, reject }) => {
      expectTypeOf(to?.name).toEqualTypeOf<'other' | undefined>()
      push('extra', { slug: 'one' })
      reject('Expired')
      // @ts-expect-error router routes are not navigation context
      push('other')
      // @ts-expect-error router rejections are not navigation context
      reject('OtherDenied')
    },
  })
})

test('assets.createLoader uses its router types', () => {
  assets.createLoader({
    context: [extra, expired],
    load: (route, { push, reject }) => {
      expectTypeOf(route.name).toEqualTypeOf<'other'>()
      push('extra', { slug: 'one' })
      reject('Expired')
      // @ts-expect-error router routes are not navigation context
      push('other')
      // @ts-expect-error router rejections are not navigation context
      reject('OtherDenied')
      return true
    },
  })
})

test('assets.createView uses its router types', () => {
  assets.createView({
    component,
    context: [extra, expired],
    props: (route, { push, reject }) => {
      expectTypeOf(route.name).toEqualTypeOf<'other'>()
      push('extra', { slug: 'one' })
      reject('Expired')
      // @ts-expect-error router routes are not navigation context
      push('other')
      // @ts-expect-error router rejections are not navigation context
      reject('OtherDenied')
      return {}
    },
  })
})

test('createHook does not infer navigation context from registration', () => {
  createHook({
    context: [],
    hook: (_to, { push, reject }) => {
      // @ts-expect-error registered routes are not navigation context
      push('login')
      // @ts-expect-error registered rejections are not navigation context
      reject('Denied')
    },
  })
})

test('createExternalRoute leaves omitted navigation context unrestricted', () => {
  const external = createExternalRoute({
    name: 'external',
    host: 'https://example.com',
  })
  external.onBeforeRouteEnter((to, { push, reject }) => {
    expectTypeOf(to.name).toEqualTypeOf<'external'>()
    push('login')
    reject('Denied')
    push('missing')
    reject('Missing')
  })
})

test('createExternalRoute uses declared navigation context', () => {
  const externalWithContext = createExternalRoute({
    name: 'externalWithContext',
    host: 'https://example.com',
    context: [extra, expired],
  })
  externalWithContext.onBeforeRouteEnter((_to, { push, reject }) => {
    push('extra', { slug: 'one' })
    reject('Expired')
    // @ts-expect-error registered routes are not navigation context
    push('login')
    // @ts-expect-error registered rejections are not navigation context
    reject('Denied')
  })
})
