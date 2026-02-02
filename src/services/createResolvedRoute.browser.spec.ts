import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { component } from '@/utilities/testHelpers'

test('given a route with params returns all params', () => {
  const route = createRoute({
    name: 'route',
    path: '/[paramA]',
    query: 'paramB=[paramB]',
    component,
  })
  const response = createResolvedRoute(route, { paramA: 'A', paramB: 'B' })

  expect(response.params).toMatchObject({
    paramA: 'A',
    paramB: 'B',
  })
})

test('given state that matches state params, returns state', () => {
  const parent = createRoute({
    name: 'parent',
    state: { foo: Boolean },
  })

  const child = createRoute({
    parent,
    name: 'foo',
    path: '/foo',
    component,
    state: { bar: String },
  })

  const response = createResolvedRoute(child, {}, { state: { foo: 'true', bar: 'abc' } })

  expect(response.state).toMatchObject({ foo: true, bar: 'abc' })
})
