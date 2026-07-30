import { describe, expectTypeOf, test } from 'vitest'
import { createRoute } from './createRoute'
import { RouteView } from '@/types/routeViews'
import echo from '@/components/echo'
import { component } from '@/utilities/testHelpers'
import { BuiltInRejectionType } from '@/types/rejection'
import { createRejection } from '@/services/createRejection'

describe('addView', () => {
  describe('default view', () => {
    test('optional props without a getter', () => {
      const route = createRoute({ name: 'route' }).addView(component)

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{}>()
    })

    test('optional props with a getter', () => {
      const route = createRoute({ name: 'route' }).addView(component, {
        props: () => ({ foo: 'bar' }),
      })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{ default: RouteView<() => { foo: string }> }>()
    })

    test('required props missing options', () => {
      // @ts-expect-error should require a props getter
      const route = createRoute({ name: 'route' }).addView(echo)

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{}>()
    })

    test('required props missing getter', () => {
      // @ts-expect-error should require a props getter
      const route = createRoute({ name: 'route' }).addView(echo, {
        prefetch: false,
      })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{}>()
    })

    test('required props with a getter', () => {
      const route = createRoute({ name: 'route' }).addView(echo, {
        props: () => ({ value: 'bar', extra: true }),
      })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{ default: RouteView<() => { value: string, extra: boolean }> }>()
    })

    test('required props with a getter with incorrect type', () => {
      const route = createRoute({ name: 'route' })
        .addView(echo, {
          // @ts-expect-error should not accept incorrect type
          props: () => ({ value: true }),
        })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{}>()
    })
  })

  describe('named view', () => {
    test('optional props without a getter is a props no-op', () => {
      const route = createRoute({ name: 'route' }).addView(component, {
        name: 'sidebar',
      })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{}>()
    })

    test('optional props with a getter produces a record', () => {
      const route = createRoute({ name: 'route' }).addView(component, {
        name: 'sidebar',
        props: () => ({ foo: 'bar' }),
      })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{ sidebar: RouteView<() => { foo: string }> }>()
    })

    test('required props with a getter produces a record', () => {
      const route = createRoute({ name: 'route' }).addView(echo, {
        name: 'sidebar',
        props: () => ({ value: 'bar', extra: true }),
      })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{ sidebar: RouteView<() => { value: string, extra: boolean }> }>()
    })
  })

  describe('prefetch', () => {
    test('prefetch alongside a getter preserves the props type', () => {
      const route = createRoute({ name: 'route' }).addView(component, {
        props: () => ({ foo: 'bar' }),
        prefetch: 'eager',
      })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{ default: RouteView<() => { foo: string }> }>()
    })

    test('prefetch without a getter is a props no-op', () => {
      const route = createRoute({ name: 'route' }).addView(component, {
        prefetch: false,
      })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{}>()
    })

    test('a named view with a getter and prefetch produces a record', () => {
      const route = createRoute({ name: 'route' })
        .addView(component, {
          name: 'sidebar',
          props: () => ({ foo: 'bar' }),
          prefetch: 'eager',
        })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{ sidebar: RouteView<() => { foo: string }> }>()
    })

    test('a named view with prefetch and no getter is a props no-op', () => {
      const route = createRoute({ name: 'route' }).addView(component, {
        name: 'sidebar',
        prefetch: 'eager',
      })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{}>()
    })

    test('required props with a getter and prefetch', () => {
      const route = createRoute({ name: 'route' })
        .addView(echo, {
          props: () => ({ value: 'bar', extra: true }),
          prefetch: 'intent',
        })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{ default: RouteView<() => { value: string, extra: boolean }> }>()
    })

    test('a getter alongside prefetch is still checked against the component props', () => {
      createRoute({ name: 'route' })
        .addView(echo, {
          // @ts-expect-error should not accept incorrect type
          props: () => ({ value: true }),
          prefetch: false,
        })
    })

    test('a getter alongside prefetch still receives the resolved route with typed params', () => {
      createRoute({ name: 'route', path: '/[paramName]' }).addView(component, {
        props: (route) => {
          expectTypeOf(route.params.paramName).toEqualTypeOf<string>()

          return {}
        },
        prefetch: 'lazy',
      })
    })

    test('accepts a boolean, a strategy, or a config object', () => {
      createRoute({ name: 'route' }).addView(component, {
        prefetch: true,
      })
      createRoute({ name: 'route' }).addView(component, {
        prefetch: 'lazy',
      })
      createRoute({ name: 'route' }).addView(component, {
        prefetch: { components: 'eager', props: false },
      })

      createRoute({ name: 'route' }).addView(component, {
        // @ts-expect-error should not accept an unknown strategy
        prefetch: 'whenever',
      })

      createRoute({ name: 'route' }).addView(component, {
        // @ts-expect-error should not accept an unknown config option
        prefetch: { styles: true },
      })
    })

    test('unknown options are rejected', () => {
      createRoute({ name: 'route' }).addView(component, {
        // @ts-expect-error should not accept an unknown option
        prefetching: true,
      })
    })
  })

  describe('multiple views', () => {
    test('default then named promotes to a record with the default under "default"', () => {
      const route = createRoute({ name: 'route' })
        .addView(component, {
          props: () => ({ foo: 'bar' }),
        })
        .addView(component, {
          name: 'sidebar',
          props: () => ({ baz: 1 }),
        })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{ default: RouteView<() => { foo: string }>, sidebar: RouteView<() => { baz: number }> }>()
    })

    test('two named views produce a record', () => {
      const route = createRoute({ name: 'route' })
        .addView(component, {
          name: 'one',
          props: () => ({ foo: 'bar' }),
        })
        .addView(component, {
          name: 'two',
          props: () => ({ baz: 1 }),
        })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{ one: RouteView<() => { foo: string }>, two: RouteView<() => { baz: number }> }>()
    })
  })

  describe('backwards compatibility', () => {
    test('addView merges with the deprecated component + props options', () => {
      const route = createRoute({ name: 'route', component }, () => ({ foo: 'bar' }))
        .addView(component, {
          name: 'sidebar',
          props: () => ({ baz: 1 }),
        })

      expectTypeOf<typeof route['views'][0]>().toEqualTypeOf<{ default: RouteView<() => { foo: string }>, sidebar: RouteView<() => { baz: number }> }>()
    })
  })

  describe('parent props', () => {
    test('bare parent props (added via addView) are passed to a child', () => {
      const parent = createRoute({ name: 'parent' }).addView(component, {
        props: () => ({ foo: 123 }),
      })

      createRoute({ name: 'child', parent }, (__, { parent }) => {
        expectTypeOf(parent.props).toEqualTypeOf<Promise<{ foo: number }>>()
        expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

        return {}
      })
    })

    test('record parent props (added via addView) are passed to a child', () => {
      const parent = createRoute({ name: 'parent' })
        .addView(component, {
          name: 'one',
          props: () => ({ foo: 123 }),
        })
        .addView(component, {
          name: 'two',
          props: async () => ({ foo: 456 }),
        })

      createRoute({ name: 'child', parent }, (__, { parent }) => {
        expectTypeOf(parent.props).toEqualTypeOf<{
          one: Promise<{ foo: number }>,
          two: Promise<{ foo: number }>,
        }>()

        return {}
      })
    })

    test('bare parent props are passed to a child when the parent getter declares its arguments', () => {
      const parent = createRoute({ name: 'parent', path: '/parent/[id]' })
        .addView(component, {
          props: (route, { push }) => ({ foo: route.params.id, canPush: typeof push === 'function' }),
        })

      createRoute({ name: 'child', parent }).addView(component, {
        props: (__, { parent }) => {
          expectTypeOf(parent.props).toEqualTypeOf<Promise<{ foo: string, canPush: boolean }>>()
          expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

          return {}
        },
      })
    })

    test('record parent props are passed to a child when the parent getters declare their arguments', () => {
      const parent = createRoute({ name: 'parent', path: '/parent/[id]' })
        .addView(component, {
          name: 'one',
          props: (route) => ({ foo: route.params.id }),
        })
        .addView(component, {
          name: 'two',
          props: async (__, { push }) => ({ canPush: typeof push === 'function' }),
        })

      createRoute({ name: 'child', parent }).addView(component, {
        props: (__, { parent }) => {
          expectTypeOf(parent.props).toEqualTypeOf<{
            one: Promise<{ foo: string }>,
            two: Promise<{ canPush: boolean }>,
          }>()

          return {}
        },
      })
    })
  })

  describe('props getter context', () => {
    test('receives the resolved route with typed params', () => {
      createRoute({ name: 'route', path: '/[paramName]' }).addView(component, {
        props: (route) => {
          expectTypeOf(route.params.paramName).toEqualTypeOf<string>()

          return {}
        },
      })
    })

    test('parent context is reconstructed from the route views/matches', () => {
      const parent = createRoute({ name: 'parent' }, async () => ({ foo: 123 }))

      createRoute({ name: 'child', parent }).addView(component, {
        props: (__, { parent }) => {
          expectTypeOf(parent.props).toEqualTypeOf<Promise<{ foo: number }>>()
          expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

          return {}
        },
      })
    })

    test('reject accepts built-in rejections, and custom rejections from context', () => {
      createRoute({ name: 'route' }).addView(component, {
        props: (__, context) => {
          expectTypeOf<Parameters<typeof context.reject>[0]>().toEqualTypeOf<BuiltInRejectionType>()

          return {}
        },
      })

      const rejection = createRejection({ type: 'NotAuthorized' })

      createRoute({ name: 'route', context: [rejection] }).addView(component, {
        props: (__, context) => {
          expectTypeOf<Parameters<typeof context.reject>[0]>().toEqualTypeOf<'NotAuthorized' | BuiltInRejectionType>()

          return {}
        },
      })
    })

    test('push and update are typed to the route', () => {
      createRoute({ name: 'route', path: '/[paramName]', context: [createRoute({ name: 'contextRoute' })] }).addView(component, {
        props: (__, context) => {
          context.push('route', { paramName: 'value' })
          context.push('contextRoute')
          context.push('/')

          // @ts-expect-error should not accept an invalid route name
          context.push('foo')

          context.update('paramName', 'value')

          // @ts-expect-error should not accept an invalid param name
          context.update('invalidParamName', 'value')

          return {}
        },
      })
    })
  })

  describe('chainability', () => {
    test('the result exposes addView, hooks, redirects, and title typed to the route', () => {
      const route = createRoute({ name: 'route', path: '/[paramName]' }).addView(component)

      expectTypeOf(route.addView).toBeFunction()
      expectTypeOf(route.redirectTo).toBeFunction()
      expectTypeOf(route.setTitle).toBeFunction()

      route.addView(component, {
        name: 'sidebar',
      }).onBeforeRouteEnter((to) => {
        expectTypeOf(to.params.paramName).toEqualTypeOf<string>()
      })
    })

    test('hooks and setTitle do not return the route (cannot chain addView after them)', () => {
      const route = createRoute({ name: 'route' })

      // @ts-expect-error onBeforeRouteEnter returns a HookRemove, not the route
      route.onBeforeRouteEnter(() => {}).addView(component)

      // @ts-expect-error setTitle returns void, not the route
      route.setTitle(() => 'title').addView(component)
    })
  })
})
