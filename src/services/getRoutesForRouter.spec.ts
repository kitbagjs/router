import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { getRoutesForRouter } from '@/services/getRoutesForRouter'
import { component } from '@/utilities'
import { createRouterPlugin } from '@/services/createRouterPlugin'

test('given routes without names, removes routes from response', () => {
  const foo = createRoute({ name: 'foo' })

  const { routes } = getRoutesForRouter([
    foo,
    createRoute({ component, name: '' }),
    createRoute({ component, name: undefined }),
    createRoute({ component }),
  ])

  expect(routes).toMatchObject([foo])
})

test('given named routes inside plugins, includes them in the response', () => {
  const pluginFoo = createRoute({ name: 'plugin-foo' })
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
  const relatedRoute = createRoute({ name: 'related' })
  const fooRoute = createRoute({ name: 'foo', context: [relatedRoute] })
  const barRoute = createRoute({ name: 'bar', context: [relatedRoute] })
  const zooRoute = createRoute({ name: 'zoo', context: [relatedRoute] })
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
  const relatedRoute = createRoute({ name: 'related' })
  const fooRoute = createRoute({ name: 'foo', context: [relatedRoute] })
  const barRoute = createRoute({ name: 'bar', context: [relatedRoute] })
  const zooRoute = createRoute({ name: 'zoo', context: [relatedRoute] })

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

test('circular context is ignored', () => {
  const routeA = createRoute({ name: 'a' })
  const routeB = createRoute({ name: 'b', context: [routeA] })

  // @ts-expect-error - you cannot actually do this
  routeA.context.push(routeB)
  routeB.context.push(routeA)

  expect(() => getRoutesForRouter([routeA, routeB])).not.toThrow()
})

test('getRouteByName returns the route by name', () => {
  const route = createRoute({ name: 'foo' })
  const { getRouteByName } = getRoutesForRouter([route])

  expect(getRouteByName('foo')).toBe(route)
})

test('getRouteByName returns undefined if the route is not found', () => {
  const { getRouteByName } = getRoutesForRouter([])

  expect(getRouteByName('foo')).toBeUndefined()
})
