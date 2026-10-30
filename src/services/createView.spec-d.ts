/* eslint-disable @typescript-eslint/no-deprecated -- Keep deprecated callback property compatibility coverage until removal. */
import { createRouterPlugin } from '@/services/createRouterPlugin'
import { createRouterAssets } from '@/services/createRouterAssets'
import { createRouter } from '@/services/createRouter'
import { expectTypeOf, test } from 'vitest'
import { defineComponent } from 'vue'
import { createView } from '@/services/createView'
import { createRoute } from '@/services/createRoute'
import { createRejection } from '@/services/createRejection'
import { View } from '@/types/view'
import { RouteView } from '@/types/routeViews'
import { ResolvedRoute, WithData } from '@/types/resolved'
import { component } from '@/utilities/testHelpers'

const userView = defineComponent((props: { id: number }) => () => props.id)

test('view props are checked against the component and preserved on attachment', () => {
  const view = createView({
    component: userView,
    props: async (route) => {
      expectTypeOf(route).toEqualTypeOf<ResolvedRoute & WithData>()
      return { id: Number(route.params.id) }
    },
    transformer: { stringify: (value) => String(value.id), parse: (value) => ({ id: Number(value) }) },
  })
  const route = createRoute({ path: '/' }).addView(view, { name: 'user' })

  expectTypeOf(view).toExtend<View<Promise<{ id: number }>>>()
  expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ user: RouteView<Promise<{ id: number }>> }>()
  // @ts-expect-error reusable view props are defined when creating the view
  createRoute({ path: '/' }).addView(view, { props: () => ({ id: 1 }) })
  // @ts-expect-error required component props need a getter
  createView({ component: userView })
  createView({
    component: userView,
    // @ts-expect-error the getter must return the component's props
    props: () => ({ id: 'wrong' }),
  })
  createView({
    component: userView,
    // @ts-expect-error a getter cannot omit required component props
    props: () => undefined,
  })
})

test('optional props can be omitted and declared context types both callbacks and attachments', () => {
  const settings = createRoute({ name: 'settings', path: '/settings' })
  const empty = createView({ component })
  expectTypeOf(empty).toExtend<View<undefined>>()
  const login = createRoute({ name: 'login', path: '/login' })
  const denied = createRejection({ type: 'Denied' })
  const view = createView({
    component,
    context: [login, denied],
    props: (_route, { push, reject, signal }) => {
      push('login')
      reject('Denied')
      expectTypeOf(signal).toEqualTypeOf<AbortSignal>()
      // @ts-expect-error the attached route is not known to the view
      push('user')
      return {}
    },
  })
  createRoute({ name: 'user', path: '/', context: [settings] }).addView(view)
    .onBeforeRouteEnter((_route, { push }) => {
      push('settings')
      push('login')
      // @ts-expect-error attaching the view does not widen context
      push('other')
    })
})

test('router assets type view callbacks with the matching loader data', () => {
  const user = createRoute({ name: 'user', path: '/users/[id]' }).addLoader(() => ({ label: 'user' }))
  const home = createRoute({ name: 'home', path: '/' }).addLoader(() => 1)
  const plugin = createRouterPlugin({ routes: [home] })
  const assets = createRouterAssets(createRouter([user], {}, [plugin]))
  const view = assets.createView({
    component: userView,
    props: (route) => {
      if (route.name === 'user') {
        expectTypeOf(route.getData()).toEqualTypeOf<Promise<{ label: string }>>()
        return { id: Number(route.params.id) }
      }
      expectTypeOf(route.getData()).toEqualTypeOf<Promise<number>>()
      return { id: 0 }
    },
  })

  expectTypeOf(view).toExtend<View<{ id: number }>>()
  // @ts-expect-error router assets still require the component's props
  assets.createView({ component: userView })
})

test('invalid view options are reported on the field for global and router factories', () => {
  createView({
    component,
    // @ts-expect-error an unknown prefetch strategy is rejected on the option
    prefetch: 'whenever',
  })

  const assets = createRouterAssets(createRouter([]))
  assets.createView({
    component: userView,
    // @ts-expect-error incorrect props are rejected on the getter
    props: () => ({ id: 'wrong' }),
  })
})
