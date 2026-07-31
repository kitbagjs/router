import { flushPromises } from '@vue/test-utils'
import echo from '@/components/echo'
import { describe, expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { component } from '@/utilities/testHelpers'
import { createRouter } from '@/services/createRouter'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'
import { withParams } from '@/services/withParams'
import { createRejection } from './createRejection'

describe('combine', () => {
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

  test('given undefined path, path is combined', () => {
    const parent = createRoute({
      path: '/parent',
    })

    const child = createRoute({
      parent: parent,
    })

    const grandChild = createRoute({
      parent: child,
      path: '/grand-child',
    })

    const kinless = createRoute({})

    expect(kinless.stringify()).toBe('/')
    expect(child.stringify()).toBe('/parent')
    expect(grandChild.stringify()).toBe('/parent/grand-child')
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

  test('given child has hoist, everything is combined except url', () => {
    const parent = createRoute({
      path: '/parent/[?parent]',
      query: 'parent=123',
      hash: 'parent',
      state: {
        parent: 'parent',
      },
      meta: {
        parent: 'parent',
      },
    })

    const child = createRoute({
      parent,
      hoist: true,
      path: '/child/[?child]',
      query: 'child=456',
      hash: 'child',
      state: {
        child: 'child',
      },
      meta: {
        child: 'child',
      },
    })

    const params = child.parse('/child/42?child=456#child')
    expect(params).toMatchObject({
      child: '42',
    })

    // @ts-expect-error - parent is not a param
    params.parent = true

    expect(child.stringify({ child: '42' })).toBe('/child/42?child=456#child')
    expect(child.state).toMatchObject({
      parent: 'parent',
      child: 'child',
    })
    expect(child.meta).toMatchObject({
      parent: 'parent',
      child: 'child',
    })
  })
})

describe('props', () => {
  test('a navigation superseded before its props settle does not report an error', async () => {
    const { promise, resolve } = Promise.withResolvers<{ value: string }>()
    const onError = vi.fn()

    const slow = createRoute({ name: 'slow', path: '/slow', component: echo }, () => promise)
    const other = createRoute({ name: 'other', path: '/other', component: echo }, () => ({ value: 'other' }))
    const home = createRoute({ name: 'home', path: '/', component: echo }, () => ({ value: 'home' }))

    const router = createRouter([home, slow, other], { initialUrl: '/' })

    router.onError(onError)

    await router.start()

    // leave slow's props in flight, then supersede it
    void router.push('slow')
    await router.push('other')

    resolve({ value: 'slow' })
    await flushPromises()

    expect(onError).not.toHaveBeenCalled()
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

  test('each depth is given its own parent context, not the resolved route\'s parent', async () => {
    const seen: unknown[] = []

    const grandparent = createRoute({
      name: 'grandparent',
      path: '/grandparent',
    }, () => ({ level: 'grandparent' }))

    const parent = createRoute({
      name: 'parent',
      parent: grandparent,
      path: '/parent',
    }, async (__, { parent }) => {
      seen.push({ self: 'parent', parentName: parent.name, parentProps: await parent.props })

      return { level: 'parent' }
    })

    const child = createRoute({
      name: 'child',
      parent,
      path: '/child',
    }, async (__, { parent }) => {
      seen.push({ self: 'child', parentName: parent.name, parentProps: await parent.props })

      return { level: 'child' }
    })

    const router = createRouter([child], {
      initialUrl: '/grandparent/parent/child',
    })

    await router.start()
    await flushPromises()

    expect(seen).toStrictEqual([
      { self: 'parent', parentName: 'grandparent', parentProps: { level: 'grandparent' } },
      { self: 'child', parentName: 'parent', parentProps: { level: 'parent' } },
    ])
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
    }, async (__, { parent }) => {
      const { foo: value } = await parent.props

      return spy({ value })
    })

    const router = createRouter([parent, child], {
      initialUrl: '/child',
    })

    await router.start()
    await flushPromises()

    expect(spy).toHaveBeenCalledWith({ value: 123 })
  })

  test('awaiting parent props that rejected throws the error', async () => {
    const error = new Error('parent props failed')
    const caught = vi.fn()

    const parent = createRoute({
      name: 'parent',
    }, async () => {
      throw error
    })

    const child = createRoute({
      name: 'child',
      parent: parent,
      path: '/child',
    }, async (__, { parent }) => {
      try {
        await parent.props
      } catch (thrown) {
        caught(thrown)
      }

      return {}
    })

    const router = createRouter([parent, child], {
      initialUrl: '/child',
    })

    await router.start()

    expect(caught).toHaveBeenCalledWith(error)
  })

  test('reading parent props that threw synchronously throws the error', async () => {
    const error = new Error('parent props failed')
    const caught = vi.fn()

    const parent = createRoute({
      name: 'parent',
    }, () => {
      throw error
    })

    const child = createRoute({
      name: 'child',
      parent: parent,
      path: '/child',
    }, async (__, { parent }) => {
      try {
        const value = await parent.props

        caught({ didNotThrow: value })
      } catch (thrown) {
        caught(thrown)
      }

      return {}
    })

    const router = createRouter([parent, child], {
      initialUrl: '/child',
    })

    await router.start()

    expect(caught).toHaveBeenCalledWith(error)
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
    }, async (__, { parent }) => {
      const { foo: value1 } = await parent.props.one
      const { bar: value2 } = await parent.props.two

      return spy({ value1, value2 })
    })

    const router = createRouter([parent, child], {
      initialUrl: '/child',
    })

    await router.start()

    expect(spy).toHaveBeenCalledWith({ value1: 123, value2: 456 })
  })

  test('parent props for view names without a getter are undefined rather than never settling', async () => {
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
      const props = parent.props as Record<string, unknown>

      return spy({ three: props.three, missing: props.missing })
    })

    const router = createRouter([parent, child], {
      initialUrl: '/child',
    })

    await router.start()

    expect(spy).toHaveBeenCalledWith({ three: undefined, missing: undefined })
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
    await flushPromises()

    expect(spy).toHaveBeenCalledWith({ value1: 123, value2: 456 })
  })
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
