import { describe, expectTypeOf, test } from 'vitest'
import { createRoute } from './createRoute'
import { RouteLoader } from '@/types/routeLoaders'
import { BuiltInRejectionType } from '@/types/rejection'
import { ResolvedRoute, WithData } from '@/types/resolved'
import { Route } from '@/types/route'
import { component } from '@/utilities/testHelpers'
import { RouteView } from '@/types/routeViews'

type User = { id: string, name: string }

type Data<TRoute extends Route> = (ResolvedRoute<TRoute> & WithData<TRoute>)['data']

describe('addLoader', () => {
  test('an async loader carries what it returns', () => {
    const route = createRoute({ name: 'route' }).addLoader(async (): Promise<User> => ({ id: '1', name: 'kitbag' }))

    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ default: RouteLoader<Promise<User>> }>()
  })

  test('a sync loader carries what it returns', () => {
    const route = createRoute({ name: 'route' }).addLoader(() => 'kitbag')

    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ default: RouteLoader<string> }>()
  })

  test('a named loader is carried under its name', () => {
    const route = createRoute({ name: 'route' }).addLoader(async (): Promise<User> => ({ id: '1', name: 'kitbag' }), {
      name: 'user',
    })

    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ user: RouteLoader<Promise<User>> }>()
  })

  test('multiple loaders accumulate', () => {
    const route = createRoute({ name: 'route' })
      .addLoader(async (): Promise<User> => ({ id: '1', name: 'kitbag' }))
      .addLoader(() => [1, 2], { name: 'posts' })

    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{
      default: RouteLoader<Promise<User>>,
      posts: RouteLoader<number[]>,
    }>()
  })

  test('a loader added under a name the route already used replaces it', () => {
    const route = createRoute({ name: 'route' })
      .addLoader(() => 'first', { name: 'user' })
      .addLoader(() => 1, { name: 'user' })

    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ user: RouteLoader<number> }>()
  })

  test('prefetch does not affect what the loader carries', () => {
    const route = createRoute({ name: 'route' }).addLoader(() => 'kitbag', {
      prefetch: 'eager',
    })

    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ default: RouteLoader<string> }>()
  })

  test('a loader leaves the route views untouched', () => {
    const route = createRoute({ name: 'route' })
      .addView(component)
      .addLoader(() => 'kitbag')

    expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ default: RouteView }>()
    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ default: RouteLoader<string> }>()
  })

  test('a view added after a loader keeps the loader', () => {
    const route = createRoute({ name: 'route' })
      .addLoader(() => 'kitbag')
      .addView(component, {
        props: () => ({ foo: 'bar' }),
      })

    expectTypeOf<typeof route['matches'][0]['views']>().toEqualTypeOf<{ default: RouteView<{ foo: string }> }>()
    expectTypeOf<typeof route['matches'][0]['loaders']>().toEqualTypeOf<{ default: RouteLoader<string> }>()
  })

  test('an ancestor loader stays on the ancestor match', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' }).addLoader(() => 'kitbag')
    const child = createRoute({ parent, name: 'child', path: '/child' }).addLoader(() => 1, { name: 'posts' })

    expectTypeOf<typeof child['matches'][0]['loaders']>().toEqualTypeOf<{ default: RouteLoader<string> }>()
    expectTypeOf<typeof child['matches'][1]['loaders']>().toEqualTypeOf<{ posts: RouteLoader<number> }>()
  })
})

describe('route data', () => {
  test('a route without loaders has no data', () => {
    const route = createRoute({ name: 'route' }).addView(component)

    expectTypeOf<Data<typeof route>>().toEqualTypeOf<undefined>()
  })

  test('a lone unnamed loader is the data itself', () => {
    const route = createRoute({ name: 'route' }).addLoader(async (): Promise<User> => ({ id: '1', name: 'kitbag' }))

    expectTypeOf<Data<typeof route>>().toEqualTypeOf<Promise<User>>()
  })

  test('a synchronous loader still resolves as a promise', () => {
    const route = createRoute({ name: 'route' }).addLoader(() => 'kitbag')

    expectTypeOf<Data<typeof route>>().toEqualTypeOf<Promise<string>>()
  })

  test('a lone named loader is keyed by its name', () => {
    const route = createRoute({ name: 'route' }).addLoader(() => 'kitbag', { name: 'user' })

    expectTypeOf<Data<typeof route>>().toEqualTypeOf<{ user: Promise<string> }>()
  })

  test('named loaders alongside an unnamed one are all keyed', () => {
    const route = createRoute({ name: 'route' })
      .addLoader(async (): Promise<User> => ({ id: '1', name: 'kitbag' }))
      .addLoader(() => [1, 2], { name: 'posts' })

    expectTypeOf<Data<typeof route>>().toEqualTypeOf<{
      default: Promise<User>,
      posts: Promise<number[]>,
    }>()
  })

  test('an ancestor loader is part of the route data', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' }).addLoader(async (): Promise<User> => ({ id: '1', name: 'kitbag' }))
    const child = createRoute({ parent, name: 'child', path: '/child' })

    expectTypeOf<Data<typeof child>>().toEqualTypeOf<Promise<User>>()
  })

  test('a named loader on a child keys the ancestor loader too', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' }).addLoader(async (): Promise<User> => ({ id: '1', name: 'kitbag' }))
    const child = createRoute({ parent, name: 'child', path: '/child' }).addLoader(() => [1, 2], { name: 'posts' })

    expectTypeOf<Data<typeof child>>().toEqualTypeOf<{
      default: Promise<User>,
      posts: Promise<number[]>,
    }>()
  })
})

describe('loader callback', () => {
  test('the route argument is the resolved route, with params', () => {
    createRoute({ name: 'route', path: '/route/[id]' }).addLoader((route) => {
      expectTypeOf(route.params.id).toEqualTypeOf<string>()

      return route.params.id
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
