import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { getRoutesForRouter } from '@/services/getRoutesForRouter'
import { component } from '@/utilities'
import { createRouterPlugin } from '@/services/createRouterPlugin'

test('given routes without names, removes routes from response', () => {
  const foo = createRoute({ name: 'foo' })

  const routes = [
    foo,
    createRoute({ component, name: '' }),
    createRoute({ component, name: undefined }),
    createRoute({ component }),
  ]

  const response = getRoutesForRouter(routes)

  expect(response).toMatchObject([foo])
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

  const response = getRoutesForRouter([], plugins)

  expect(response).toMatchObject([pluginFoo])
})

test('given named routes inside route context, includes them in the response', () => {
  const relatedRoute = createRoute({ name: 'related' })
  const routes = [
    createRoute({ name: 'foo', context: [relatedRoute] }),
    createRoute({ name: 'bar', context: [relatedRoute] }),
    createRoute({ name: 'zoo', context: [relatedRoute] }),
  ]
  const plugins = [
    createRouterPlugin({
      routes,
    }),
  ]

  const response = getRoutesForRouter([], plugins)

  expect(response).toMatchObject([
    ...routes,
    relatedRoute,
  ])
})

test('given named routes inside route context of plugin routes, includes them in the response', () => {
  const relatedRoute = createRoute({ name: 'related' })
  const routes = [
    createRoute({ name: 'foo', context: [relatedRoute] }),
    createRoute({ name: 'bar', context: [relatedRoute] }),
    createRoute({ name: 'zoo', context: [relatedRoute] }),
  ]

  const response = getRoutesForRouter(routes)

  expect(response).toMatchObject([
    ...routes,
    relatedRoute,
  ])
})
