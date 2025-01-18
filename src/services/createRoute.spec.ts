import { expect, expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { path } from '@/services/path'
import { query } from '@/services/query'
import { component } from '@/utilities/testHelpers'

test('given parent, path is combined', () => {
  const parent = createRoute({
    path: '/parent',
  })

  const child = createRoute({
    parent: parent,
    path: path('/child/[id]', { id: Number }),
  })

  expect(child.path).toMatchObject({
    value: '/parent/child/[id]',
    params: {
      id: Number,
    },
  })
})

test('given parent, query is combined', () => {
  const parent = createRoute({
    query: 'static=123',
  })

  const child = createRoute({
    parent: parent,
    query: query('sort=[sort]', { sort: Boolean }),
  })

  expect(child.query).toMatchObject({
    value: 'static=123&sort=[sort]',
    params: {
      sort: Boolean,
    },
  })
})

test('given parent, state is combined into state', () => {
  const parent = createRoute({
    state: {
      foo: Number,
    },
  })

  const child = createRoute({
    parent: parent,
    state: {
      bar: String,
    },
  })

  expect(child.state).toMatchObject({
    foo: Number,
    bar: String,
  })
})

test('given parent and child without state, state matches parent', () => {
  const parent = createRoute({
    state: {
      foo: Number,
    },
  })

  const child = createRoute({
    parent: parent,
  })

  expect(child.state).toMatchObject({
    foo: Number,
  })
})

test('given parent, meta is combined', () => {
  const parent = createRoute({
    meta: {
      foo: 123,
    },
  })

  const child = createRoute({
    parent: parent,
    meta: {
      bar: 'zoo',
    },
  })

  expect(child.meta).toMatchObject({
    foo: 123,
    bar: 'zoo',
  })
})

test('given parent and child without meta, meta matches parent', () => {
  const parent = createRoute({
    meta: {
      foo: 123,
    },
  })

  const child = createRoute({
    parent: parent,
  })

  expect(child.meta).toMatchObject({
    foo: 123,
  })
})

test('sync parent props are passed to child props', () => {
  const parent = createRoute({
    name: 'parent',
  }, () => ({ foo: 123 }))

  createRoute({
    name: 'child',
    parent: parent,
  }, (__, { parent }) => {
    expectTypeOf(parent.props).toEqualTypeOf<{ foo: number }>()
    expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

    return {}
  })
})

test('async parent props are passed to child props', () => {
  const parent = createRoute({
    name: 'parent',
  }, async () => ({ foo: 123 }))

  createRoute({
    name: 'child',
    parent: parent,
  }, (__, { parent }) => {
    expectTypeOf(parent.props).toEqualTypeOf<Promise<{ foo: number }>>()
    expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

    return {}
  })
})

test('parent props are passed to child props when multiple parent components are used', () => {
  const parent = createRoute({
    name: 'parent',
    components: {
      one: component,
      two: component,
    },
  }, {
    one: () => ({ foo: 123 }),
    two: async () => ({ foo: 456 }),
  })

  createRoute({
    name: 'child',
    parent: parent,
  }, (__, { parent }) => {
    expectTypeOf(parent.props).toEqualTypeOf<{
      one: { foo: number },
      two: Promise<{ foo: number }>,
    }>()
    expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

    return {}
  })
})

test('parent props are passed to child props when multiple child components are used', () => {
  const parent = createRoute({
    name: 'parent',
  }, async () => ({ foo: 123 }))

  createRoute({
    name: 'child',
    parent: parent,
    components: {
      one: component,
      two: component,
    },
  }, {
    one: (__, { parent }) => {
      expectTypeOf(parent.props).toEqualTypeOf<Promise<{ foo: number }>>()
      expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

      return {}
    },
    two: (__, { parent }) => {
      expectTypeOf(parent.props).toEqualTypeOf<Promise<{ foo: number }>>()
      expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

      return {}
    },
  })
})
