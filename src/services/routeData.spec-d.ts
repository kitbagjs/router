import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'
import { PropsCallbackRoute } from '@/types/resolved'

test('default and named selections retain their loader return types', () => {
  createRoute({ name: 'route', path: '/' })
    .addLoader(() => 'first')
    .addView(component, {
      props: async (route) => {
        expectTypeOf(route.getData()).toEqualTypeOf<Promise<string>>()
        expectTypeOf(route.getData('default')).toEqualTypeOf<Promise<string>>()
        // @ts-expect-error a later loader is not known to this callback
        route.getData('count')
        return { value: await route.getData() }
      },
    })
    .addLoader(() => 42, { name: 'count' })
    .addView(component, {
      name: 'named',
      props: (route) => {
        expectTypeOf(route.getData()).toEqualTypeOf<Promise<string>>()
        expectTypeOf(route.getData('default')).toEqualTypeOf<Promise<string>>()
        expectTypeOf(route.getData('count')).toEqualTypeOf<Promise<number>>()
        // @ts-expect-error an unknown loader name is rejected
        route.getData('missing')
        return {}
      },
    })
})

test('a parent callback and child see their declared loader names', () => {
  const parent = createRoute({ path: '/parent' }).addLoader(() => 'parent')
    .addView(component, {
      props: async (route) => {
        expectTypeOf(route.getData()).toEqualTypeOf<Promise<string>>()
        return { value: await route.getData() }
      },
    })
  createRoute({ parent, path: '/child' }).addLoader(() => 42, { name: 'count' })
    .addView(component, {
      props: (route) => {
        expectTypeOf(route.getData()).toEqualTypeOf<Promise<string>>()
        expectTypeOf(route.getData('count')).toEqualTypeOf<Promise<number>>()
        return {}
      },
    })
})

test('routes without a default loader require a declared name', () => {
  createRoute({ path: '/' }).addLoader(() => 42, { name: 'count' })
    .addView(component, {
      props: (route) => {
        expectTypeOf(route.getData('count')).toEqualTypeOf<Promise<number>>()
        // @ts-expect-error this route has no default loader
        route.getData()
        // @ts-expect-error this route has no default loader
        route.getData('default')
        return {}
      },
    })

  createRoute({ path: '/' }).addView(component, {
    props: (route) => {
      // @ts-expect-error this route has no loaders
      route.getData()
      // @ts-expect-error this route has no loaders
      route.getData('missing')
      return {}
    },
  })
})

test('generic callbacks can read data but loaders and unresolved routes cannot', () => {
  const callback = (route: PropsCallbackRoute): void => {
    expectTypeOf(route.getData()).toExtend<Promise<unknown>>()
    expectTypeOf(route.getData('named')).toExtend<Promise<unknown>>()
  }
  expectTypeOf(callback).toBeFunction()

  createRoute({ path: '/' }).addLoader((route) => {
    // @ts-expect-error loaders cannot read their own route data
    route.getData()
    return 'loaded'
  })
  const router = createRouter([createRoute({ name: 'route' })])
  // @ts-expect-error resolving does not start loaders
  router.resolve('route').getData()
})
