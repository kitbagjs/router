import { BuiltInRejectionType, Rejection } from '@/types/rejection'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'
import { describe, test, expectTypeOf } from 'vitest'
import { createRouterPlugin } from './createRouterPlugin'
import { createRejection } from './createRejection'
import { RouterAbort } from '@/types/routerAbort'
import { RouteUpdate } from '@/types/routeUpdate'
import { ResolvedRouteUnion } from '@/types/resolved'
import { RouterRouteUnion } from '@/types/router'

describe('hooks', () => {
  const parent = createRoute({
    name: 'parent',
    path: '/parent/[parentParam]',
    component,
  })

  const child = createRoute({
    name: 'child',
    path: '/child/[childParam]',
    parent,
    component,
  })

  const pluginRoute = createRoute({
    name: 'plugin',
    path: '/plugin/[pluginParam]',
    component,
  })

  const routes = [parent, child] as const

  const pluginRoutes = [pluginRoute] as const

  const plugin = createRouterPlugin({
    routes: pluginRoutes,
  })

  const router = createRouter(routes, { initialUrl: '/' }, [plugin])

  type Routes = typeof routes | typeof pluginRoutes | [Rejection<'NotFound'>]

  test('to and from can be narrowed', () => {
    router.onBeforeRouteEnter((to, context) => {
      if (to.name === 'parent') {
        expectTypeOf(to.name).toEqualTypeOf<'parent'>()
        expectTypeOf(to.params).toEqualTypeOf<{ parentParam: string }>()
      }

      if (context.from?.name === 'parent') {
        expectTypeOf(context.from.name).toEqualTypeOf<'parent'>()
        expectTypeOf(context.from.params).toEqualTypeOf<{ parentParam: string }>()
      }

      if (to.name === 'child') {
        expectTypeOf(to.name).toEqualTypeOf<'child'>()
        expectTypeOf(to.params).toEqualTypeOf<{ parentParam: string, childParam: string }>()
      }

      if (context.from?.name === 'child') {
        expectTypeOf(context.from.name).toEqualTypeOf<'child'>()
        expectTypeOf(context.from.params).toEqualTypeOf<{ parentParam: string, childParam: string }>()
      }

      expectTypeOf(context.push).toEqualTypeOf(router.push)
      expectTypeOf(context.replace).toEqualTypeOf(router.replace)
    })
  })

  test('context.push', () => {
    router.onBeforeRouteEnter((_to, context) => {
      expectTypeOf(context.push).toEqualTypeOf(router.push)
    })
  })

  test('context.replace', () => {
    router.onBeforeRouteEnter((_to, context) => {
      expectTypeOf(context.replace).toEqualTypeOf(router.replace)
    })
  })

  test('context.reject', () => {
    router.onBeforeRouteEnter((_to, context) => {
      expectTypeOf(context.reject).toEqualTypeOf(router.reject)
    })
  })

  test('onError context has no update, which has no destination to act on', () => {
    router.onError((_error, context) => {
      expectTypeOf<keyof typeof context>().toEqualTypeOf<'to' | 'from' | 'source' | 'reject' | 'push' | 'replace'>()
    })
  })

  test('context.update', () => {
    router.onBeforeRouteEnter((_to, context) => {
      expectTypeOf(context.update).toEqualTypeOf<RouteUpdate<ResolvedRouteUnion<Routes[number]>>>()
    })
  })

  test('context.abort', () => {
    router.onBeforeRouteEnter((_to, context) => {
      expectTypeOf(context.abort).toEqualTypeOf<RouterAbort>()
    })
  })
})

describe('rejections', () => {
  test('built in rejections are valid', () => {
    const _router = createRouter([])
    type Source = Parameters<typeof _router.reject>[0]
    type Expect = BuiltInRejectionType

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
    expectTypeOf<ReturnType<typeof _router.reject>>().toEqualTypeOf<Promise<void>>()
  })

  test('the routes a rejection happened between are not part of the public signature', () => {
    const _router = createRouter([])

    // @ts-expect-error reject only accepts a type
    _router.reject('NotFound', { to: null, from: null })
  })

  test('custom rejections are valid', () => {
    const myCustomRejection = createRejection({
      type: 'MyCustomRejection',

      status: 404,
      component,
    })

    const _router = createRouter([], {
      rejections: [myCustomRejection],
    })

    type Source = Parameters<typeof _router.reject>[0]
    type Expect = BuiltInRejectionType | 'MyCustomRejection'

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('custom rejections from plugins are valid', () => {
    const myPluginRejection = createRejection({
      type: 'MyPluginRejection',

      status: 404,
      component,
    })
    const plugin = createRouterPlugin({
      rejections: [myPluginRejection],
    })

    const _router = createRouter([], {}, [plugin])

    type Source = Parameters<typeof _router.reject>[0]
    type Expect = BuiltInRejectionType | 'MyPluginRejection'

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })
})

describe('options.rejections in hooks', () => {
  test('route hooks do not have access to router-level rejections', () => {
    const route = createRoute({
      name: 'root',
      path: '/',
      component,
    })

    const customRejection = createRejection({
      type: 'CustomRejection',

      status: 404,
      component: { template: '<div>This is a custom rejection</div>' },
    })

    createRouter([route], {
      initialUrl: '/',
      rejections: [customRejection],
    })

    route.onBeforeRouteUpdate((_to, { reject, push }) => {
      expectTypeOf(reject).parameters.toEqualTypeOf<[BuiltInRejectionType]>()

      // ok
      push('root')
      // @ts-expect-error does not know about routes outside of context
      push('fakeRoute')
    })
  })

  test('router hooks have access to router-level rejections', () => {
    const route = createRoute({
      name: 'root',
      path: '/',
      component,
    })

    const customRejection = createRejection({
      type: 'CustomRejection',

      status: 404,
      component: { template: '<div>This is a custom rejection</div>' },
    })

    const router = createRouter([route], {
      initialUrl: '/',
      rejections: [customRejection],
    })

    router.onBeforeRouteUpdate((_to, { reject, push }) => {
      expectTypeOf(reject).parameters.toEqualTypeOf<[BuiltInRejectionType | 'CustomRejection']>()

      // ok
      push('root')
      // @ts-expect-error does not know about routes outside of router
      push('fakeRoute')
    })
  })
})

describe('route', () => {
  test('route is never if there are no named routes', () => {
    const route = createRoute({
      component,
    })

    expectTypeOf(route.name).toEqualTypeOf<''>()

    const router = createRouter([route])

    expectTypeOf(router.route).toEqualTypeOf<RouterRouteUnion<[Rejection<'NotFound'>]>>()
  })

  test('route union does not include routes without a name', () => {
    // does not include routes without a name
    const routeA = createRoute({
      component,
    })

    // does not include routes with an empty name
    const routeB = createRoute({
      name: '',
      component,
    })

    const routeC = createRoute({
      name: 'routeC',
      component,
    })

    const routeD = createRoute({
      name: 'routeD',
      component,
    })

    const router = createRouter([routeA, routeB, routeC, routeD])

    expectTypeOf(router.route).toEqualTypeOf<RouterRouteUnion<[typeof routeC, typeof routeD, Rejection<'NotFound'>]>>()
  })
})

describe('route.matched.meta', () => {
  test('is always defined', () => {
    const routeA = createRoute({
      name: 'routeA',
    })

    const router = createRouter([routeA])

    expectTypeOf(router.route.matched.meta).toEqualTypeOf<Readonly<{}>>()
  })

  test('union type is preserved', () => {
    const routeA = createRoute({
      name: 'routeA',
    })

    const routeB = createRoute({
      name: 'routeB',
      meta: { public: true },
    })

    const router = createRouter([routeA, routeB])

    expectTypeOf(router.route.matched.meta).toEqualTypeOf<Readonly<{}> | Readonly<{ public: true }>>()
  })

  test('union type can be narrowed', () => {
    const routeA = createRoute({
      name: 'routeA',
    })

    const routeB = createRoute({
      name: 'routeB',
      meta: { public: true },
    })

    const router = createRouter([routeA, routeB])

    if (router.route.matched.name === 'routeA') {
      expectTypeOf(router.route.matched.meta).toEqualTypeOf<Readonly<{}>>()
    }

    if (router.route.matched.name === 'routeB') {
      expectTypeOf(router.route.matched.meta).toEqualTypeOf<Readonly<{ public: true }>>()
    }

    if ('public' in router.route.matched.meta) {
      expectTypeOf(router.route.matched.meta.public).toEqualTypeOf<true>()
    }
  })
})

test('rejections use route-owned hook types and participate in the router destination union', () => {
  const denied = createRejection({ type: 'Denied' }).addLoader(() => 'explanation')
  const account = createRoute({ name: 'account', path: '/account/[id]', context: [denied] })
  const router = createRouter([account])

  account.onBeforeRouteEnter((to) => {
    expectTypeOf(to.name).toEqualTypeOf<'account'>()
    expectTypeOf(to.params.id).toEqualTypeOf<string>()
  })
  account.onAfterRouteLeave((_to, { from }) => {
    expectTypeOf(from.name).toEqualTypeOf<'account'>()
    expectTypeOf(from.params.id).toEqualTypeOf<string>()
  })
  denied.onBeforeRouteEnter((to) => {
    expectTypeOf(to.name).toEqualTypeOf<'Denied'>()
  })
  denied.onAfterRouteLeave((_to, { from }) => {
    expectTypeOf(from.name).toEqualTypeOf<'Denied'>()
  })
  router.onBeforeRouteEnter((to) => {
    expectTypeOf(to.name).toEqualTypeOf<'account' | 'Denied' | 'NotFound'>()
  })

  if (router.route.name === 'Denied') {
    expectTypeOf(router.route.data).toEqualTypeOf<Promise<string>>()
  }

  expectTypeOf(router.reject).parameters.toEqualTypeOf<['Denied' | 'NotFound']>()
})

test('a custom NotFound replaces the built-in destination in the public union', () => {
  const missing = createRejection({ type: 'NotFound' }).addLoader(() => 'explanation')
  const router = createRouter([missing])

  expectTypeOf(router.route.data).toEqualTypeOf<Promise<string>>()
})
