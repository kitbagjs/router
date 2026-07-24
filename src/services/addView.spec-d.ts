import { describe, expectTypeOf, test } from 'vitest'
import { createRoute } from './createRoute'
import echo from '@/components/echo'
import { component } from '@/utilities/testHelpers'
import { BuiltInRejectionType } from '@/types/rejection'
import { createRejection } from '@/services/createRejection'

describe('addView', () => {
  describe('default view', () => {
    test('optional props without a getter', () => {
      const route = createRoute({ name: 'route' }).addView(component)

      expectTypeOf<typeof route['views'][0]['props']>().toEqualTypeOf<undefined>()
    })

    test('optional props with a getter', () => {
      const route = createRoute({ name: 'route' }).addView(component, () => ({ foo: 'bar' }))

      expectTypeOf<typeof route['views'][0]['props']>().toEqualTypeOf<() => { foo: string }>()
    })

    test('required props missing getter', () => {
      // @ts-expect-error should require a props getter
      const route = createRoute({ name: 'route' }).addView(echo)

      expectTypeOf<typeof route['views'][0]['props']>().toEqualTypeOf<undefined>()
    })

    test('required props with a getter', () => {
      const route = createRoute({ name: 'route' }).addView(echo, () => ({ value: 'bar', extra: true }))

      expectTypeOf<typeof route['views'][0]['props']>().toEqualTypeOf<() => { value: string, extra: boolean }>()
    })

    test('required props with a getter with incorrect type', () => {
      const route = createRoute({ name: 'route' })
        // @ts-expect-error should not accept incorrect type
        .addView(echo, () => ({ value: true }))

      expectTypeOf<typeof route['views'][0]['props']>().toEqualTypeOf<undefined>()
    })
  })

  describe('named view', () => {
    test('optional props without a getter is a props no-op', () => {
      const route = createRoute({ name: 'route' }).addView('sidebar', component)

      expectTypeOf<typeof route['views'][0]['props']>().toEqualTypeOf<undefined>()
    })

    test('optional props with a getter produces a record', () => {
      const route = createRoute({ name: 'route' }).addView('sidebar', component, () => ({ foo: 'bar' }))

      expectTypeOf<typeof route['views'][0]['props']>().toEqualTypeOf<{ sidebar: () => { foo: string } }>()
    })

    test('required props with a getter produces a record', () => {
      const route = createRoute({ name: 'route' }).addView('sidebar', echo, () => ({ value: 'bar', extra: true }))

      expectTypeOf<typeof route['views'][0]['props']>().toEqualTypeOf<{ sidebar: () => { value: string, extra: boolean } }>()
    })
  })

  describe('multiple views', () => {
    test('default then named promotes to a record with the default under "default"', () => {
      const route = createRoute({ name: 'route' })
        .addView(component, () => ({ foo: 'bar' }))
        .addView('sidebar', component, () => ({ baz: 1 }))

      expectTypeOf<typeof route['views'][0]['props']>().toEqualTypeOf<{ default: () => { foo: string }, sidebar: () => { baz: number } }>()
    })

    test('two named views produce a record', () => {
      const route = createRoute({ name: 'route' })
        .addView('one', component, () => ({ foo: 'bar' }))
        .addView('two', component, () => ({ baz: 1 }))

      expectTypeOf<typeof route['views'][0]['props']>().toEqualTypeOf<{ one: () => { foo: string }, two: () => { baz: number } }>()
    })
  })

  describe('backwards compatibility', () => {
    test('addView merges with the deprecated component + props options', () => {
      const route = createRoute({ name: 'route', component }, () => ({ foo: 'bar' }))
        .addView('sidebar', component, () => ({ baz: 1 }))

      expectTypeOf<typeof route['views'][0]['props']>().toEqualTypeOf<{ default: () => { foo: string }, sidebar: () => { baz: number } }>()
    })
  })

  describe('parent props', () => {
    test('bare parent props (added via addView) are passed to a child', () => {
      const parent = createRoute({ name: 'parent' }).addView(component, () => ({ foo: 123 }))

      createRoute({ name: 'child', parent }, (__, { parent }) => {
        expectTypeOf(parent.props).toEqualTypeOf<{ foo: number }>()
        expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

        return {}
      })
    })

    test('record parent props (added via addView) are passed to a child', () => {
      const parent = createRoute({ name: 'parent' })
        .addView('one', component, () => ({ foo: 123 }))
        .addView('two', component, async () => ({ foo: 456 }))

      createRoute({ name: 'child', parent }, (__, { parent }) => {
        expectTypeOf(parent.props).toEqualTypeOf<{
          one: { foo: number },
          two: Promise<{ foo: number }>,
        }>()

        return {}
      })
    })
  })

  describe('props getter context', () => {
    test('receives the resolved route with typed params', () => {
      createRoute({ name: 'route', path: '/[paramName]' }).addView(component, (route) => {
        expectTypeOf(route.params.paramName).toEqualTypeOf<string>()

        return {}
      })
    })

    test('parent context is reconstructed from the route views/matches', () => {
      const parent = createRoute({ name: 'parent' }, async () => ({ foo: 123 }))

      createRoute({ name: 'child', parent }).addView(component, (__, { parent }) => {
        expectTypeOf(parent.props).toEqualTypeOf<Promise<{ foo: number }>>()
        expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

        return {}
      })
    })

    test('reject accepts built-in rejections, and custom rejections from context', () => {
      createRoute({ name: 'route' }).addView(component, (__, context) => {
        expectTypeOf<Parameters<typeof context.reject>[0]>().toEqualTypeOf<BuiltInRejectionType>()

        return {}
      })

      const rejection = createRejection({ type: 'NotAuthorized' })

      createRoute({ name: 'route', context: [rejection] }).addView(component, (__, context) => {
        expectTypeOf<Parameters<typeof context.reject>[0]>().toEqualTypeOf<'NotAuthorized' | BuiltInRejectionType>()

        return {}
      })
    })

    test('push and update are typed to the route', () => {
      createRoute({ name: 'route', path: '/[paramName]', context: [createRoute({ name: 'contextRoute' })] }).addView(component, (__, context) => {
        context.push('route', { paramName: 'value' })
        context.push('contextRoute')
        context.push('/')

        // @ts-expect-error should not accept an invalid route name
        context.push('foo')

        context.update('paramName', 'value')

        // @ts-expect-error should not accept an invalid param name
        context.update('invalidParamName', 'value')

        return {}
      })
    })
  })

  describe('chainability', () => {
    test('the result exposes addView, hooks, redirects, and title typed to the route', () => {
      const route = createRoute({ name: 'route', path: '/[paramName]' }).addView(component)

      expectTypeOf(route.addView).toBeFunction()
      expectTypeOf(route.redirectTo).toBeFunction()
      expectTypeOf(route.setTitle).toBeFunction()

      route.addView('sidebar', component).onBeforeRouteEnter((to) => {
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
