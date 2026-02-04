import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { component } from '@/utilities/testHelpers'
import { createRouter } from '@/services/createRouter'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'
import { withParams } from '@/services/withParams'
import { createRejection } from './createRejection'

test('given parent, path is combined', () => {
  const parent = createRoute({
    path: '/parent',
  })

  const child = createRoute({
    parent: parent,
    path: withParams('/child/[id]', { id: Number }),
  })

  expect(child.stringify({ id: 123 })).toBe('/parent/child/123')
})

test('given parent, query is combined', () => {
  const parent = createRoute({
    query: 'static=123',
  })

  const child = createRoute({
    parent: parent,
    query: withParams('sort=[sort]', { sort: Boolean }),
  })

  expect(child.stringify({ sort: true })).toBe('/?static=123&sort=true')
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

test('given parent, context is combined', () => {
  const parentRejection = createRejection({ type: 'aRejection' })
  const childRelated = createRoute({ name: 'bRoute' })

  const parent = createRoute({
    meta: {
      foo: 123,
    },
    context: [parentRejection],
  })

  const child = createRoute({
    parent,
    context: [childRelated],
    meta: {
      bar: 'zoo',
    },
  })

  child.onAfterRouteEnter((_to, { push, reject }) => {
    // ok
    push('bRoute')
    // @ts-expect-error should not accept an invalid route name
    push('fakeRoute')
    // ok
    reject('aRejection')
    // ok
    reject('NotFound')
    // @ts-expect-error should not accept an invalid rejection type
    reject('fakeRejection')
  })

  expect(child.context).toMatchObject([parentRejection, childRelated])
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

test('parent context is passed to child props', async () => {
  const spy = vi.fn()
  const parent = createRoute({
    name: 'parent',
  })

  const child = createRoute({
    name: 'child',
    parent: parent,
    path: '/child',
  }, (_, { parent }) => {
    return spy(parent)
  })

  const router = createRouter([parent, child], {
    initialUrl: '/child',
  })

  await router.start()

  expect(spy).toHaveBeenCalledWith({ name: 'parent', props: undefined })
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

test.each([
  ['/[foo]', 'foo=[foo]', '[bar]'],
  ['/[foo]', 'foo=[bar]', '[foo]'],
  ['/[bar]', 'foo=[foo]', '[foo]'],
])('given duplicate params across different parts of the route, throws DuplicateParamsError', (path, query, hash) => {
  const action: () => void = () => createRoute({
    path,
    query,
    hash,
  })

  expect(action).toThrow(DuplicateParamsError)
})
