import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'
import { describe, test, expectTypeOf } from 'vitest'
import { createRouterPlugin } from './createRouterPlugin'
import { BuiltInRejectionType } from './createRouterReject'
import { createRejection } from './createRejection'
import { AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, AddErrorHook } from '@/types/hooks'
import { RouterAbort } from '@/types/routerAbort'
import { RouteUpdate } from '@/types/routeUpdate'
import { ResolvedRouteUnion } from '@/types/resolved'

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

  type Routes = typeof routes | typeof pluginRoutes

  test('functions are correctly typed', () => {
    expectTypeOf(router.onBeforeRouteEnter).toEqualTypeOf<AddBeforeEnterHook<Routes, never>>()
    expectTypeOf(router.onBeforeRouteLeave).toEqualTypeOf<AddBeforeLeaveHook<Routes, never>>()
    expectTypeOf(router.onBeforeRouteUpdate).toEqualTypeOf<AddBeforeUpdateHook<Routes, never>>()
    expectTypeOf(router.onAfterRouteEnter).toEqualTypeOf<AddAfterEnterHook<Routes, never>>()
    expectTypeOf(router.onAfterRouteLeave).toEqualTypeOf<AddAfterLeaveHook<Routes, never>>()
    expectTypeOf(router.onAfterRouteUpdate).toEqualTypeOf<AddAfterUpdateHook<Routes, never>>()
    expectTypeOf(router.onError).toEqualTypeOf<AddErrorHook<Routes[number], Routes, never>>()
  })

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
  })

  test('custom rejections are valid', () => {
    const myCustomRejection = createRejection({
      type: 'MyCustomRejection',
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
