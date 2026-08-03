import { describe, expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { LoaderDataAccessError } from '@/errors/loaderDataAccessError'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { component } from '@/utilities/testHelpers'

/**
 * The route a loader is given carries no data, so reaching for it is what a loader written without types
 * would do.
 */
function readOwnData(route: object): unknown {
  return (route as { data: unknown }).data
}

describe('running loaders', () => {
  test('a loader runs on navigation and its data resolves', async () => {
    const route = createRoute({ name: 'route', path: '/[id]' })
      .addLoader(async (route) => `user-${route.params.id}`)

    const router = createRouter([route], { initialUrl: '/1' })

    await router.start()

    await expect(router.route.data).resolves.toBe('user-1')
  })

  test('a synchronous loader still resolves as a promise', async () => {
    const route = createRoute({ name: 'route', path: '/' })
      .addLoader(() => 'kitbag')

    const router = createRouter([route], { initialUrl: '/' })

    await router.start()

    await expect(router.route.data).resolves.toBe('kitbag')
  })

  test('named loaders are keyed by name', async () => {
    const route = createRoute({ name: 'route', path: '/[id]' })
      .addLoader(async (route) => `user-${route.params.id}`)
      .addLoader(async () => [1, 2], { name: 'posts' })

    const router = createRouter([route], { initialUrl: '/1' })

    await router.start()

    const data = router.route.data as Record<string, Promise<unknown>>

    await expect(data.default).resolves.toBe('user-1')
    await expect(data.posts).resolves.toStrictEqual([1, 2])
  })

  test('an ancestor loader is part of the route data', async () => {
    const parent = createRoute({ name: 'parent', path: '/parent/[id]' })
      .addLoader(async (route) => `user-${route.params.id}`)

    const child = createRoute({ parent, name: 'child', path: '/child' })
      .addLoader(async () => 'posts', { name: 'posts' })

    const router = createRouter([parent, child], { initialUrl: '/parent/1/child' })

    await router.start()

    const data = router.route.data as Record<string, Promise<unknown>>

    await expect(data.default).resolves.toBe('user-1')
    await expect(data.posts).resolves.toBe('posts')
  })

  test('a loader and a view of the same name are separate values', async () => {
    const route = createRoute({ name: 'route', path: '/' })
      .addView(component, { props: () => ({ from: 'props' }) })
      .addLoader(() => 'from loader')

    const router = createRouter([route], { initialUrl: '/' })

    await router.start()

    await expect(router.route.data).resolves.toBe('from loader')
  })

  test('a route without loaders has no data', async () => {
    const route = createRoute({ name: 'route', path: '/' }).addView(component)

    const router = createRouter([route], { initialUrl: '/' })

    await router.start()

    expect(router.route.data).toBeUndefined()
  })

  test('data is enumerable for named loaders', async () => {
    const route = createRoute({ name: 'route', path: '/' })
      .addLoader(() => 'a', { name: 'a' })
      .addLoader(() => 'b', { name: 'b' })

    const router = createRouter([route], { initialUrl: '/' })

    await router.start()

    expect(Object.keys(router.route.data as object)).toStrictEqual(['a', 'b'])
  })
})

describe('re-running loaders', () => {
  test('a param change runs the loader again', async () => {
    const load = vi.fn((route: { params: { id: string } }) => `user-${route.params.id}`)

    const route = createRoute({ name: 'route', path: '/[id]' }).addLoader(load)

    const router = createRouter([route], { initialUrl: '/1' })

    await router.start()

    await expect(router.route.data).resolves.toBe('user-1')

    await router.push('route', { id: '2' })

    await expect(router.route.data).resolves.toBe('user-2')
    expect(load).toHaveBeenCalledTimes(2)
  })

  test('a query change runs the loader again', async () => {
    const load = vi.fn((route: { query: URLSearchParams }) => route.query.get('page'))

    const route = createRoute({ name: 'route', path: '/' }).addLoader(load)

    const router = createRouter([route], { initialUrl: '/?page=1' })

    await router.start()

    await expect(router.route.data).resolves.toBe('1')

    await router.push('route', {}, { query: { page: '2' } })

    await expect(router.route.data).resolves.toBe('2')
    expect(load).toHaveBeenCalledTimes(2)
  })

  test('data from a navigation that was superseded is abandoned', async () => {
    const { promise: never } = Promise.withResolvers<string>()

    const slow = createRoute({ name: 'slow', path: '/slow' }).addLoader(() => never)
    const fast = createRoute({ name: 'fast', path: '/fast' }).addLoader(() => 'fast')

    const router = createRouter([slow, fast], { initialUrl: '/slow' })

    await router.start()

    const abandoned = router.route.data

    await router.push('fast')

    await expect(abandoned).rejects.toThrow(NavigationAbandonedError)
    await expect(router.route.data).resolves.toBe('fast')
  })
})

describe('loaders do not block', () => {
  test('the route is current before its loader settles', async () => {
    const { promise, resolve } = Promise.withResolvers<string>()

    const route = createRoute({ name: 'route', path: '/' }).addLoader(() => promise)

    const router = createRouter([route], { initialUrl: '/' })

    await router.start()

    expect(router.route.name).toBe('route')

    resolve('late')

    await expect(router.route.data).resolves.toBe('late')
  })

  test('props settle without waiting on a loader', async () => {
    const { promise, resolve } = Promise.withResolvers<string>()
    const props = vi.fn(() => ({ value: 'props' }))

    const route = createRoute({ name: 'route', path: '/' })
      .addView(component, { props })
      .addLoader(() => promise)

    const router = createRouter([route], { initialUrl: '/' })

    await router.start()

    expect(props).toHaveBeenCalledTimes(1)

    resolve('late')

    await expect(router.route.data).resolves.toBe('late')
  })
})

describe('loader context', () => {
  test('a loader can reject', async () => {
    const onRejection = vi.fn()

    const route = createRoute({ name: 'route', path: '/' })
      .addLoader((_route, { reject }) => reject('NotFound'))

    const router = createRouter([route], { initialUrl: '/' })

    router.onRejection(onRejection)

    await router.start()

    expect(onRejection).toHaveBeenCalledWith('NotFound', expect.anything())
  })

  test('a loader can push', async () => {
    const other = createRoute({ name: 'other', path: '/other' }).addView(component)
    const route = createRoute({ name: 'route', path: '/', context: [other] })
      .addLoader((_route, { push }) => push('other'))

    const router = createRouter([route, other], { initialUrl: '/' })

    await router.start()

    // the push is acted on when the loader settles, which navigation does not wait for
    await vi.waitFor(() => expect(router.route.name).toBe('other'))
  })

  test('a loader that throws runs error hooks with a loader source', async () => {
    const onError = vi.fn()
    const error = new Error('loader failed')

    const route = createRoute({ name: 'route', path: '/' }).addLoader(() => {
      throw error
    })

    const router = createRouter([route], { initialUrl: '/' })

    router.onError(onError)

    await router.start()

    expect(onError).toHaveBeenCalledWith(error, expect.objectContaining({ source: 'loader' }))
  })

  test('a props getter can await a parent loader', async () => {
    const parent = createRoute({ name: 'parent', path: '/parent/[id]' })
      .addLoader(async (route) => `user-${route.params.id}`)

    const props = vi.fn()

    const child = createRoute({ parent, name: 'child', path: '/child' })
      .addView(component, {
        props: async (_route, { parent }) => {
          props(await parent.data)

          return {}
        },
      })

    const router = createRouter([parent, child], { initialUrl: '/parent/1/child' })

    await router.start()

    expect(props).toHaveBeenCalledWith('user-1')
  })

  test('a loader reading the data of its own route errors', async () => {
    const onError = vi.fn()

    const route = createRoute({ name: 'route', path: '/' })
      .addLoader((route) => readOwnData(route))

    const router = createRouter([route], { initialUrl: '/' })

    router.onError(onError)

    await router.start()

    expect(onError).toHaveBeenCalledWith(expect.any(LoaderDataAccessError), expect.objectContaining({ source: 'loader' }))
  })

  test('a loader reading a sibling loader on its own route errors', async () => {
    const onError = vi.fn()

    const route = createRoute({ name: 'route', path: '/' })
      .addLoader(async () => 'sibling', { name: 'sibling' })
      .addLoader((route) => readOwnData(route), { name: 'reader' })

    const router = createRouter([route], { initialUrl: '/' })

    router.onError(onError)

    await router.start()

    expect(onError).toHaveBeenCalledWith(expect.any(LoaderDataAccessError), expect.objectContaining({ source: 'loader' }))
  })

  test('a props getter can read the data of its own route', async () => {
    const seen = vi.fn()

    const route = createRoute({ name: 'route', path: '/' })
      .addLoader(async () => 'loaded', { name: 'thing' })
      .addView(component, {
        props: async (route) => {
          seen(await route.data.thing)

          return {}
        },
      })

    const router = createRouter([route], { initialUrl: '/' })

    await router.start()

    expect(seen).toHaveBeenCalledWith('loaded')
  })

  test('a loader can await a parent loader', async () => {
    const parent = createRoute({ name: 'parent', path: '/parent' })
      .addLoader(async () => 'from parent', { name: 'parentData' })

    const child = createRoute({ parent, name: 'child', path: '/child' })
      .addLoader(async (_route, { parent }) => `child saw ${await parent.data.parentData}`)

    const router = createRouter([parent, child], { initialUrl: '/parent/child' })

    await router.start()

    const data = router.route.data as Record<string, Promise<unknown>>

    await expect(data.default).resolves.toBe('child saw from parent')
  })
})
