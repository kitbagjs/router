/* eslint-disable @typescript-eslint/no-deprecated -- Keep deprecated callback property compatibility coverage until removal. */
import { describe, expectTypeOf, test } from 'vitest'
import { createRoute } from './createRoute'
import { Loader } from '@/types/loader'
import { createLoader } from '@/services/createLoader'
import { BuiltInRejectionType } from '@/types/rejection'
import { component } from '@/utilities/testHelpers'
import { RouteView } from '@/types/routeViews'

type User = { id: string, name: string }

describe('addLoader', () => {
  test('an async loader carries what it returns', () => {
    const route = createRoute({ name: 'route' }).addLoader(async (): Promise<User> => ({ id: '1', name: 'kitbag' }))

    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ default: Loader<Promise<User>> }>()
  })

  test('a sync loader carries what it returns', () => {
    const route = createRoute({ name: 'route' }).addLoader(() => 'kitbag')

    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ default: Loader<string> }>()
  })

  test('a named loader is carried under its name', () => {
    const route = createRoute({ name: 'route' }).addLoader(async (): Promise<User> => ({ id: '1', name: 'kitbag' }), {
      name: 'user',
    })

    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ user: Loader<Promise<User>> }>()
  })

  test('multiple loaders accumulate', () => {
    const route = createRoute({ name: 'route' })
      .addLoader(async (): Promise<User> => ({ id: '1', name: 'kitbag' }))
      .addLoader(() => [1, 2], { name: 'posts' })

    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{
      default: Loader<Promise<User>>,
      posts: Loader<number[]>,
    }>()
  })

  test('a loader added under a name the route already used replaces it', () => {
    const route = createRoute({ name: 'route' })
      .addLoader(() => 'first', { name: 'user' })
      .addLoader(() => 1, { name: 'user' })

    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ user: Loader<number> }>()
  })

  test('prefetch does not affect what the loader carries', () => {
    const route = createRoute({ name: 'route' }).addLoader(() => 'kitbag', {
      prefetch: 'eager',
    })

    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ default: Loader<string> }>()
  })

  test('a loader leaves the route views untouched', () => {
    const route = createRoute({ name: 'route' })
      .addView(component)
      .addLoader(() => 'kitbag')

    expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ default: RouteView }>()
    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ default: Loader<string> }>()
  })

  test('a view added after a loader keeps the loader', () => {
    const route = createRoute({ name: 'route' })
      .addLoader(() => 'kitbag')
      .addView(component, {
        props: () => ({ foo: 'bar' }),
      })

    expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ default: RouteView<{ foo: string }> }>()
    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ default: Loader<string> }>()
  })

  test('an ancestor loader stays on the ancestor match', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' }).addLoader(() => 'kitbag')
    const child = createRoute({ parent, name: 'child', path: '/child' }).addLoader(() => 1, { name: 'posts' })

    expectTypeOf<typeof child['matches'][0]['loaders']>().toEqualTypeOf<{ default: Loader<string> }>()
    expectTypeOf<typeof child['matches'][1]['loaders']>().toEqualTypeOf<{ posts: Loader<number> }>()
  })
})

describe('parent data', () => {
  test('the default parent loader returns its data promise', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' }).addLoader(async (): Promise<User> => ({ id: '1', name: 'kitbag' }))

    createRoute({ parent, name: 'child', path: '/child' }).addLoader((_route, { parent }) => {
      expectTypeOf(parent.getData()).toEqualTypeOf<Promise<User>>()

      return null
    }, { name: 'child' })
  })

  test('named parent loaders retain their return types', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' })
      .addLoader(async (): Promise<User> => ({ id: '1', name: 'kitbag' }))
      .addLoader(() => [1, 2], { name: 'posts' })

    createRoute({ parent, name: 'child', path: '/child' }).addLoader((_route, { parent }) => {
      expectTypeOf(parent.getData()).toEqualTypeOf<Promise<User>>()
      expectTypeOf(parent.getData('posts')).toEqualTypeOf<Promise<number[]>>()

      return null
    }, { name: 'child' })
  })

  test('parents without loaders reject all names', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' }).addView(component)

    createRoute({ parent, name: 'child', path: '/child' }).addLoader((_route, { parent }) => {
      // @ts-expect-error the parent has no loader to select
      parent.getData()

      return null
    })
  })

  test('props getters can read parent loader data', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' }).addLoader(async (): Promise<User> => ({ id: '1', name: 'kitbag' }))

    createRoute({ parent, name: 'child', path: '/child' }).addView(component, {
      props: async (_route, { parent }) => {
        expectTypeOf(parent.getData()).toEqualTypeOf<Promise<User>>()

        await parent.getData()

        return {}
      },
    })
  })
})

describe('loader callback', () => {
  test('the route argument is the resolved route, with params', () => {
    createRoute({ name: 'route', path: '/route/[id]' }).addLoader((route) => {
      expectTypeOf(route.params.id).toEqualTypeOf<string>()

      return route.params.id
    })
  })

  test('a loader is not given the data of the route it belongs to', () => {
    createRoute({ name: 'route', path: '/' })
      .addLoader(() => 'first', { name: 'first' })
      .addLoader((route) => {
        // @ts-expect-error a loader cannot read the data of the route it belongs to
        const data = route.getData()

        return 'second'
      }, { name: 'second' })
  })

  test('a props getter is given the data of the route it belongs to', () => {
    createRoute({ name: 'route', path: '/' })
      .addLoader(async () => 'kitbag', { name: 'user' })
      .addView(component, {
        props: async (route) => {
          expectTypeOf(route.getData('user')).toEqualTypeOf<Promise<string>>()

          await route.getData('user')

          return {}
        },
      })
  })

  test('the context includes the navigation helpers and the parent', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' }).addView(component, {
      props: (): { foo: string } => ({ foo: 'bar' }),
    })

    createRoute({ parent, name: 'child', path: '/child/[id]' }).addLoader(async (_route, context) => {
      expectTypeOf<Parameters<typeof context.reject>[0]>().toEqualTypeOf<BuiltInRejectionType>()
      expectTypeOf(context.parent.name).toEqualTypeOf<'parent'>()

      context.push('child', { id: 'value' })
      context.replace('child', { id: 'value' })
      context.update('id', 'value')

      // @ts-expect-error should not accept a route the route has no context for
      context.push('unrelated')

      // @ts-expect-error should not accept an invalid param name
      context.update('invalidParamName', 'value')

      return await context.parent.props
    })
  })
})

test('payload options are typed by what the loader resolves to', () => {
  createRoute({ name: 'route', path: '/' }).addLoader(async () => new Map<string, number>(), {
    transformer: {
      stringify: (value) => {
        expectTypeOf(value).toEqualTypeOf<Map<string, number>>()

        return JSON.stringify(Array.from(value.entries()))
      },
      parse: (encoded) => new Map<string, number>(JSON.parse(encoded)),
    },
  })

  createRoute({ name: 'route', path: '/' }).addLoader(async () => new Map<string, number>(), {
    transformer: {
      stringify: (value) => JSON.stringify(Array.from(value.entries())),
      // @ts-expect-error parse must give back what the loader resolves to
      parse: (encoded) => encoded,
    },
  })

  createRoute({ name: 'route', path: '/' }).addLoader(async () => new Map<string, number>(), {
    // @ts-expect-error a payload must declare both stringify and parse
    transformer: {
      stringify: (value: Map<string, number>) => JSON.stringify(Array.from(value.entries())),
    },
  })
})

test('attachment options report errors on their fields for callbacks and reusable loaders', () => {
  const route = createRoute({ name: 'route' })
  route.addLoader(() => 1, {
    // @ts-expect-error an unknown prefetch strategy is rejected on the option
    prefetch: 'whenever',
  })
  route.addLoader(createLoader({ load: () => 1 }), {
    // @ts-expect-error an unknown prefetch strategy is rejected on the option
    prefetch: 'whenever',
  })
})
