import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'
import { describe, test, expectTypeOf } from 'vitest'
import { AddRouterAfterRouteHook, AddRouterBeforeRouteHook } from '@/types/router'
import { createRouterPlugin } from './createRouterPlugin'
import { CallbackContextAbort } from './createCallbackContext'

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
    expectTypeOf(router.onBeforeRouteEnter).toEqualTypeOf<AddRouterBeforeRouteHook<Routes>>()
    expectTypeOf(router.onBeforeRouteLeave).toEqualTypeOf<AddRouterBeforeRouteHook<Routes>>()
    expectTypeOf(router.onBeforeRouteUpdate).toEqualTypeOf<AddRouterBeforeRouteHook<Routes>>()
    expectTypeOf(router.onAfterRouteEnter).toEqualTypeOf<AddRouterAfterRouteHook<Routes>>()
    expectTypeOf(router.onAfterRouteLeave).toEqualTypeOf<AddRouterAfterRouteHook<Routes>>()
    expectTypeOf(router.onAfterRouteUpdate).toEqualTypeOf<AddRouterAfterRouteHook<Routes>>()
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

  test('context.abort', () => {
    router.onBeforeRouteEnter((_to, context) => {
      expectTypeOf(context.abort).toEqualTypeOf<CallbackContextAbort>()
    })
  })
})
