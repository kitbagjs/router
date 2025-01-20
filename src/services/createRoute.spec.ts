import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { path } from '@/services/path'
import { query } from '@/services/query'
import { createRouter } from '@/main'
import echo from '@/components/echo'
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

test('sync parent props are passed to child props', async () => {
  const spy = vi.fn()

  const parent = createRoute({
    name: 'parent',
  }, () => ({ foo: 123 }))

  const child = createRoute({
    name: 'child',
    parent: parent,
    path: '/child',
  }, (__, { parent }) => {
    return spy({ value: parent.props.foo })
  })

  const router = createRouter([parent, child], {
    initialUrl: '/child',
  })

  await router.start()

  expect(spy).toHaveBeenCalledWith({ value: 123 })
})

test('async parent props are passed to child props', async () => {
  const spy = vi.fn()

  const parent = createRoute({
    name: 'parent',
  }, async () => ({ foo: 123 }))

  const child = createRoute({
    name: 'child',
    parent: parent,
    path: '/child',
  }, async (__, { parent }) => {
    expect(parent.props).toBeDefined()
    expect(parent.props).toBeInstanceOf(Promise)

    const { foo: value } = await parent.props

    return spy({ value })
  })

  const router = createRouter([parent, child], {
    initialUrl: '/child',
  })

  await router.start()

  expect(spy).toHaveBeenCalledWith({ value: 123 })
})

test('sync parent props with multiple views are passed to child props', async () => {
  const spy = vi.fn()

  const parent = createRoute({
    name: 'parent',
    components: {
      one: component,
      two: component,
      three: component,
    },
  }, {
    one: () => ({ foo: 123 }),
    two: () => ({ bar: 456 }),
  })

  const child = createRoute({
    name: 'child',
    parent: parent,
    path: '/child',
  }, (__, { parent }) => {
    return spy({
      value1: parent.props.one.foo,
      value2: parent.props.two.bar,
    })
  })

  const router = createRouter([parent, child], {
    initialUrl: '/child',
  })

  await router.start()

  expect(spy).toHaveBeenCalledWith({ value1: 123, value2: 456 })
})

test('async parent props with multiple views are passed to child props', async () => {
  const spy = vi.fn()

  const parent = createRoute({
    name: 'parent',
    components: {
      one: component,
      two: component,
      three: component,
    },
  }, {
    one: async () => ({ foo: 123 }),
    two: async () => ({ bar: 456 }),
  })

  const child = createRoute({
    name: 'child',
    parent: parent,
    path: '/child',
  }, async (__, { parent }) => {
    expect(parent.props).toBeDefined()
    expect(parent.props.one).toBeInstanceOf(Promise)
    expect(parent.props.two).toBeInstanceOf(Promise)

    const { foo: value1 } = await parent.props.one
    const { bar: value2 } = await parent.props.two

    return spy({
      value1,
      value2,
    })
  })

  const router = createRouter([parent, child], {
    initialUrl: '/child',
  })

  await router.start()

  expect(spy).toHaveBeenCalledWith({ value1: 123, value2: 456 })
})
