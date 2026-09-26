import { describe, expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { getRoutesForRouter } from '@/services/getRoutesForRouter'
import { component } from '@/utilities'
import { createRouterPlugin } from '@/services/createRouterPlugin'
import { createExternalRoute } from '@/services/createExternalRoute'
import { UnreachableRouteError } from '@/errors/unreachableRouteError'

test('given routes without names, removes routes from response', () => {
  const foo = createRoute({ name: 'foo', path: '/foo' })

  const { routes } = getRoutesForRouter([
    foo,
    createRoute({ component, name: '' }),
    createRoute({ component, name: undefined }),
    createRoute({ component }),
  ])

  expect(routes).toMatchObject([foo])
})

test('given named routes inside plugins, includes them in the response', () => {
  const pluginFoo = createRoute({ name: 'plugin-foo', path: '/plugin-foo' })
  const plugins = [
    createRouterPlugin({
      routes: [
        pluginFoo,
        createRoute({ name: '' }),
        createRoute({ name: undefined }),
        createRoute({ component }),
      ],
    }),
  ]

  const { routes } = getRoutesForRouter([], plugins)

  expect(routes).toMatchObject([pluginFoo])
})

test('given named routes inside route context, includes them in the response', () => {
  const relatedRoute = createRoute({ name: 'related', path: '/related' })
  const fooRoute = createRoute({ name: 'foo', path: '/foo', context: [relatedRoute] })
  const barRoute = createRoute({ name: 'bar', path: '/bar', context: [relatedRoute] })
  const zooRoute = createRoute({ name: 'zoo', path: '/zoo', context: [relatedRoute] })
  const plugins = [
    createRouterPlugin({
      routes: [
        fooRoute,
        barRoute,
        zooRoute,
      ],
    }),
  ]

  const { routes } = getRoutesForRouter([], plugins)

  expect(routes).toMatchObject([
    fooRoute,
    relatedRoute,
    barRoute,
    zooRoute,
  ])
})

test('given named routes inside route context of plugin routes, includes them in the response', () => {
  const relatedRoute = createRoute({ name: 'related', path: '/related' })
  const fooRoute = createRoute({ name: 'foo', path: '/foo', context: [relatedRoute] })
  const barRoute = createRoute({ name: 'bar', path: '/bar', context: [relatedRoute] })
  const zooRoute = createRoute({ name: 'zoo', path: '/zoo', context: [relatedRoute] })

  const { routes } = getRoutesForRouter([
    fooRoute,
    barRoute,
    zooRoute,
  ])

  expect(routes).toMatchObject([
    fooRoute,
    relatedRoute,
    barRoute,
    zooRoute,
  ])
})

test('return routes sorted by depth', () => {
  const routeA = createRoute({ name: 'a', path: '/a' })
  const routeB = createRoute({ name: 'b', parent: routeA, path: '/b' })
  const routeC = createRoute({ name: 'c', parent: routeB, path: '/c' })
  const routeD = createRoute({ name: 'd', parent: routeA, path: '/d' })
  const routeE = createRoute({ name: 'e', path: '/e' })

  const { routes } = getRoutesForRouter([routeA, routeB, routeC, routeD, routeE])

  expect(routes.map((route) => route.name)).toMatchObject([
    'c',
    'b',
    'd',
    'a',
    'e',
  ])
})

describe('getRouteByName', () => {
  test('circular context is ignored', () => {
    const routeA = createRoute({ name: 'a', path: '/a' })
    const routeB = createRoute({ name: 'b', path: '/b', context: [routeA] })

    // @ts-expect-error - you cannot actually do this
    routeA.context.push(routeB)
    routeB.context.push(routeA)

    expect(() => getRoutesForRouter([routeA, routeB])).not.toThrow()
  })

  test('returns the route by name', () => {
    const route = createRoute({ name: 'foo', path: '/foo' })
    const { getRouteByName } = getRoutesForRouter([route])

    expect(getRouteByName('foo')).toBe(route)
  })

  test('getRouteByName returns undefined if the route is not found', () => {
    const { getRouteByName } = getRoutesForRouter([])

    expect(getRouteByName('foo')).toBeUndefined()
  })
})

describe('unreachable routes', () => {
  test('throws for a named route with an empty path', () => {
    const route = createRoute({ name: 'main', path: '' })

    expect(() => getRoutesForRouter([route])).toThrow(UnreachableRouteError)
  })

  test('throws for a named route without a path', () => {
    const route = createRoute({ name: 'main' })

    expect(() => getRoutesForRouter([route])).toThrow(UnreachableRouteError)
  })

  test('throws for a named route whose path does not start with a slash', () => {
    const route = createRoute({ name: 'foo', path: 'foo' })

    expect(() => getRoutesForRouter([route])).toThrow(UnreachableRouteError)
  })

  test('throws for a named child whose combined path does not start with a slash', () => {
    const parent = createRoute({ path: 'parent' })
    const child = createRoute({ name: 'child', parent, path: '/child' })

    expect(() => getRoutesForRouter([parent, child])).toThrow(UnreachableRouteError)
  })

  test('does not throw for an unnamed route with an empty path', () => {
    const parent = createRoute({ path: '' })
    const child = createRoute({ name: 'child', parent, path: '/child' })

    expect(() => getRoutesForRouter([parent, child])).not.toThrow()
  })

  test('does not throw for a child whose combined path starts with a slash', () => {
    const parent = createRoute({ name: 'parent', path: '/' })
    const child = createRoute({ name: 'child', parent, path: 'child' })

    expect(() => getRoutesForRouter([parent, child])).not.toThrow()
  })

  test('does not throw for an external route with an empty path', () => {
    const route = createExternalRoute({ name: 'docs', host: 'https://kitbag.dev', path: '' })

    expect(() => getRoutesForRouter([route])).not.toThrow()
  })

  test('does not throw when the base makes the path start with a slash', () => {
    const route = createRoute({ name: 'main', path: '' })

    expect(() => getRoutesForRouter([route], [], { base: '/app' })).not.toThrow()
  })

  test('throws for an unreachable plugin route', () => {
    const plugins = [
      createRouterPlugin({
        routes: [createRoute({ name: 'plugin-foo', path: '' })],
      }),
    ]

    expect(() => getRoutesForRouter([], plugins)).toThrow(UnreachableRouteError)
  })
})
