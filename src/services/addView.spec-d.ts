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

      expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ default: RouteView }>()
    })

    test('optional props with a getter', () => {
      const route = createRoute({ name: 'route' }).addView(component, {
        props: () => ({ foo: 'bar' }),
      })

      expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ default: RouteView<{ foo: string }> }>()
    })

    test('required props missing options', () => {
      // @ts-expect-error should require a props getter
      createRoute({ name: 'route' }).addView(echo)
    })

    test('required props missing getter', () => {
      // @ts-expect-error should require a props getter
      createRoute({ name: 'route' }).addView(echo, {
        prefetch: false,
      })
    })

    test('required props with a getter', () => {
      const route = createRoute({ name: 'route' }).addView(echo, {
        props: () => ({ value: 'bar', extra: true }),
      })

      expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ default: RouteView<{ value: string, extra: boolean }> }>()
    })

    test('required props with a getter with incorrect type', () => {
      createRoute({ name: 'route' })
        .addView(echo, {
          // @ts-expect-error should not accept incorrect type
          props: () => ({ value: true }),
        })
    })
  })

  describe('named view', () => {
    test('a view added without a getter is recorded with no props', () => {
      const route = createRoute({ name: 'route' }).addView(component, {
        name: 'sidebar',
      })

      expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ sidebar: RouteView }>()
    })

    test('optional props with a getter produces a record', () => {
      const route = createRoute({ name: 'route' }).addView(component, {
        name: 'sidebar',
        props: () => ({ foo: 'bar' }),
      })

      expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ sidebar: RouteView<{ foo: string }> }>()
    })

    test('required props with a getter produces a record', () => {
      const route = createRoute({ name: 'route' }).addView(echo, {
        name: 'sidebar',
        props: () => ({ value: 'bar', extra: true }),
      })

      expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ sidebar: RouteView<{ value: string, extra: boolean }> }>()
    })
  })

  describe('prefetch', () => {
    test('prefetch alongside a getter preserves the props type', () => {
      const route = createRoute({ name: 'route' }).addView(component, {
        props: () => ({ foo: 'bar' }),
        prefetch: 'eager',
      })

      expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ default: RouteView<{ foo: string }> }>()
    })

    test('prefetch without a getter records the view with no props', () => {
      const route = createRoute({ name: 'route' }).addView(component, {
        prefetch: false,
      })

      expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ default: RouteView }>()
    })

    test('a named view with a getter and prefetch produces a record', () => {
      const route = createRoute({ name: 'route' })
        .addView(component, {
          name: 'sidebar',
          props: () => ({ foo: 'bar' }),
          prefetch: 'eager',
        })

      expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ sidebar: RouteView<{ foo: string }> }>()
    })

    test('a named view with prefetch and no getter is recorded with no props', () => {
      const route = createRoute({ name: 'route' }).addView(component, {
        name: 'sidebar',
        prefetch: 'eager',
      })

      expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ sidebar: RouteView }>()
    })

    test('required props with a getter and prefetch', () => {
      const route = createRoute({ name: 'route' })
        .addView(echo, {
          props: () => ({ value: 'bar', extra: true }),
          prefetch: 'intent',
        })

      expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ default: RouteView<{ value: string, extra: boolean }> }>()
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

      expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ default: RouteView<{ foo: string }>, sidebar: RouteView<{ baz: number }> }>()
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

      expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ one: RouteView<{ foo: string }>, two: RouteView<{ baz: number }> }>()
    })
  })

  describe('parent props', () => {
    test('parent props are undefined when the parent has no props', () => {
      const parent = createRoute({ name: 'parent' })

      createRoute({ name: 'child', parent })
        .addView(component, {
          props: (__, { parent }) => {
            expectTypeOf(parent.props).toEqualTypeOf<undefined>()
            expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

            return {}
          },
        })
    })

    test('parent props are undefined when the parent has views but no getter', () => {
      const parent = createRoute({ name: 'parent' }).addView(component)

      createRoute({ name: 'child', parent })
        .addView(component, {
          props: (__, { parent }) => {
            expectTypeOf(parent.props).toEqualTypeOf<undefined>()
            expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

            return {}
          },
        })
    })

    test('sync parent props are passed to a child', () => {
      const parent = createRoute({ name: 'parent' }).addView(component, {
        props: () => ({ foo: 123 }),
      })

      createRoute({ name: 'child', parent })
        .addView(component, {
          props: (__, { parent }) => {
            expectTypeOf(parent.props).toEqualTypeOf<{ foo: number }>()
            expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

            return {}
          },
        })
    })

    test('async parent props are passed to a child', () => {
      const parent = createRoute({ name: 'parent' }).addView(component, {
        props: async () => ({ foo: 123 }),
      })

      createRoute({ name: 'child', parent })
        .addView(component, {
          props: (__, { parent }) => {
            expectTypeOf(parent.props).toEqualTypeOf<Promise<{ foo: number }>>()
            expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

            return {}
          },
        })
    })

    test('parent props are passed to every view a child adds', () => {
      const parent = createRoute({ name: 'parent' }).addView(component, {
        props: async () => ({ foo: 123 }),
      })

      createRoute({ name: 'child', parent })
        .addView(component, {
          name: 'one',
          props: (__, { parent }) => {
            expectTypeOf(parent.props).toEqualTypeOf<Promise<{ foo: number }>>()
            expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

            return {}
          },
        })
        .addView(component, {
          name: 'two',
          props: (__, { parent }) => {
            expectTypeOf(parent.props).toEqualTypeOf<Promise<{ foo: number }>>()
            expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

            return {}
          },
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

      createRoute({ name: 'child', parent })
        .addView(component, {
          props: (__, { parent }) => {
            expectTypeOf(parent.props).toEqualTypeOf<{
              one: { foo: number },
              two: Promise<{ foo: number }>,
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

    test('push accepts urls, the current route, and routes from context', () => {
      createRoute({ name: 'route', path: '/[paramName]', context: [createRoute({ name: 'contextRoute' })] }).addView(component, {
        props: (__, context) => {
          context.push('route', { paramName: 'value' })
          context.push('contextRoute')
          context.push('/')

          // @ts-expect-error should not accept an invalid route name
          context.push('foo')

          return {}
        },
      })
    })

    test('replace accepts urls, the current route, and routes from context', () => {
      createRoute({ name: 'route', path: '/[paramName]', context: [createRoute({ name: 'contextRoute' })] }).addView(component, {
        props: (__, context) => {
          context.replace('route', { paramName: 'value' })
          context.replace('contextRoute')
          context.replace('/')

          // @ts-expect-error should not accept an invalid route name
          context.replace('foo')

          return {}
        },
      })
    })

    test('update accepts params based on the current route', () => {
      createRoute({ name: 'route', path: '/[paramName]' }).addView(component, {
        props: (__, context) => {
          context.update('paramName', 'value')

          // @ts-expect-error should not accept an invalid param name
          context.update('invalidParamName', 'value')

          context.update({ paramName: 'value' })

          // @ts-expect-error should not accept invalid params
          context.update({ invalidParamName: 'value' })

          context.update({ paramName: 'value' }, { replace: true })

          // @ts-expect-error should not accept invalid options
          context.update({ paramName: 'value' }, { invalid: true })

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
