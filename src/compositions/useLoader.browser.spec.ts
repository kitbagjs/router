import { payloadToScript } from '@/services/payload'
import { component } from '@/utilities/testHelpers'
/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createLoader, createRejection, createRoute, createRouter, createRouterAssets, Router, useLoader, useRoute } from '@/main'
import { warnLoaderFallback } from '@/services/warnLoaderFallback'

vi.mock('@/services/warnLoaderFallback', () => ({ warnLoaderFallback: vi.fn() }))

afterEach(() => {
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

function mountConsumer<TResult>(router: Router, setup: () => TResult): TResult {
  const wrapper = mount(defineComponent({
    setup() {
      const result = setup()
      // Keep the composable's refs intact when reading through the component instance.
      return { getResult: () => result }
    },
    render: () => null,
  }), { global: { plugins: [router] } })

  return wrapper.vm.getResult()
}

test('shares the route load between consumers', async () => {
  const pending = Promise.withResolvers<string>()
  const load = vi.fn(() => pending.promise)
  const loader = createLoader({ load })
  const route = createRoute({ name: 'user', path: '/' }).addLoader(loader, { name: 'user' })
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const { imported, attached } = mountConsumer(router, () => ({
    imported: useLoader(loader),
    attached: useLoader(router.route.loaders.user),
  }))

  expect(imported.loading.value).toBe(true)
  pending.resolve('loaded')
  await flushPromises()
  expect(imported.data.value).toBe('loaded')
  expect(attached.data.value).toBe('loaded')
  expect(attached.loading.value).toBe(false)
  expect(load).toHaveBeenCalledTimes(1)
})

test('sets loading while the initial navigation is pending', async () => {
  const entering = Promise.withResolvers<void>()
  const loader = createLoader({ load: () => 42 })
  const route = createRoute({ name: 'home', path: '/' }).addLoader(loader)
  route.onBeforeRouteEnter(() => entering.promise)
  const router = createRouter([route], { initialUrl: '/' })
  const result = mountConsumer(router, () => useLoader(loader))

  expect(result.loading.value).toBe(true)
  entering.resolve()
  await flushPromises()
  expect(result.data.value).toBe(42)
})

test('clears error and updates data after a successful navigation', async () => {
  const pending = Promise.withResolvers<string>()
  const loader = createLoader({
    load: (route) => {
      return route.params.id === '1' ? pending.promise : 'recovered'
    },
  })
  const route = createRoute({ name: 'user', path: '/[id]' }).addLoader(loader)
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const result = mountConsumer(router, () => useLoader(loader))
  const error = new Error('request failed')

  pending.reject(error)
  await flushPromises()
  const { data, loading, error: failure } = result
  expect(failure.value).toBe(error)
  expect(data.value).toBeUndefined()
  expect(loading.value).toBe(false)

  await router.push('/2')
  expect(failure.value).toBeUndefined()
  expect(data.value).toBe('recovered')
})

test('sets error and clears data when loading fails', async () => {
  const pending = Promise.withResolvers<string>()
  const loader = createLoader({ load: () => pending.promise })
  const route = createRoute({ name: 'home', path: '/' }).addLoader(loader)
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const result = mountConsumer(router, () => useLoader(loader))
  const failure = new Error('request failed')

  pending.reject(failure)
  await flushPromises()

  expect(result.error.value).toBe(failure)
  expect(result.data.value).toBeUndefined()
  expect(result.loading.value).toBe(false)
})

test('reads the selected named attachment', async () => {
  const load = vi.fn<() => number>()
    .mockReturnValueOnce(1)
    .mockReturnValueOnce(2)
  const loader = createLoader({ load })
  const route = createRoute({ name: 'home', path: '/' })
    .addLoader(loader, { name: 'first' })
    .addLoader(loader, { name: 'second' })
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const selected = mountConsumer(router, () => useLoader(router.route.loaders.second))

  expect(selected.data.value).toBe(2)
})

test('keeps loader data isolated between routers', async () => {
  const loader = createLoader({ load: (route) => String(route.params.id) })
  const route = createRoute({ name: 'user', path: '/[id]' }).addLoader(loader)
  const first = createRouter([route], { initialUrl: '/1', isGlobalRouter: false })
  const second = createRouter([route], { initialUrl: '/2', isGlobalRouter: false })
  await Promise.all([first.start(), second.start()])
  const firstAssets = createRouterAssets(first)
  const secondAssets = createRouterAssets(second)
  const firstResult = mountConsumer(first, () => firstAssets.useLoader(loader))
  const secondResult = mountConsumer(second, () => secondAssets.useLoader(loader))

  expect(firstResult.data.value).toBe('1')
  expect(secondResult.data.value).toBe('2')
})

describe('fallback loaders', () => {
  test('starts a new load when navigating to the same URL', async () => {
    const load = vi.fn<() => number>()
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2)
    const loader = createLoader({ load })
    const route = createRoute({ name: 'home', path: '/' })
    const router = createRouter([route], { initialUrl: '/' })
    await router.start()
    const result = mountConsumer(router, () => useLoader(loader))

    expect(result.data.value).toBe(1)
    await router.push('/')
    await flushPromises()

    expect(result.data.value).toBe(2)
    expect(load).toHaveBeenCalledTimes(2)
  })

  test('does not start new loads after the component unmounts', async () => {
    const load = vi.fn(() => 'loaded')
    const loader = createLoader({ load })
    const route = createRoute({ name: 'home', path: '/[id]' })
    const router = createRouter([route], { initialUrl: '/1' })
    await router.start()
    const consumer = defineComponent({
      setup: () => {
        useLoader(loader)
      },
      render: () => null,
    })
    const wrapper = mount(consumer, { global: { plugins: [router] } })

    expect(load).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    await router.push('/2')

    expect(load).toHaveBeenCalledTimes(1)
  })

  test('loads a missing definition once for all consumers', async () => {
    const pending = Promise.withResolvers<string>()
    const load = vi.fn(() => pending.promise)
    const loader = createLoader({ load })
    const route = createRoute({ name: 'home', path: '/' })
    const router = createRouter([route], { initialUrl: '/' })
    await router.start()
    const { first, second } = mountConsumer(router, () => ({
      first: useLoader(loader),
      second: useLoader(loader),
    }))

    expect(first.loading.value).toBe(true)
    expect(load).toHaveBeenCalledTimes(1)
    expect(warnLoaderFallback).toHaveBeenCalledExactlyOnceWith({
      loader,
      route: expect.objectContaining({ name: 'home', href: '/' }),
      fallback: { reason: 'missing' },
      isServerRendering: false,
    })

    pending.resolve('loaded')
    await flushPromises()
    expect(first.data.value).toBe('loaded')
    expect(second.data.value).toBe('loaded')
  })

  test('loads ambiguous definitions separately from route attachments', async () => {
    const load = vi.fn<() => number>()
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2)
      .mockReturnValue(3)
    const loader = createLoader({ load })
    const route = createRoute({ name: 'home', path: '/' })
      .addLoader(loader, { name: 'first' })
      .addLoader(loader, { name: 'second' })
    const router = createRouter([route], { initialUrl: '/' })
    await router.start()
    const result = mountConsumer(router, () => useLoader(loader))

    expect(result.data.value).toBe(3)
    expect(warnLoaderFallback).toHaveBeenCalledExactlyOnceWith({
      loader,
      route: expect.objectContaining({ name: 'home', href: '/' }),
      fallback: { reason: 'ambiguous', names: ['first', 'second'] },
      isServerRendering: false,
    })
  })

  test('aborts the previous load and keeps its original route', async () => {
    const first = Promise.withResolvers<string>()
    const second = Promise.withResolvers<string>()
    const signals: AbortSignal[] = []
    const params: unknown[] = []
    const loader = createLoader({
      load: (route, { signal }) => {
        signals.push(signal)
        const pending = route.params.id === '1' ? first.promise : second.promise

        return pending.then((data) => {
          params.push(route.params.id)
          return data
        })
      },
    })
    const route = createRoute({ name: 'home', path: '/[id]' })
    const router = createRouter([route], { initialUrl: '/1' })
    await router.start()
    const result = mountConsumer(router, () => useLoader(loader))
    await flushPromises()

    await router.push('/2')
    expect(signals[0].aborted).toBe(true)

    first.resolve('obsolete')
    await flushPromises()
    expect(result.data.value).toBeUndefined()

    second.resolve('current')
    await flushPromises()
    expect(result.data.value).toBe('current')
    expect(params).toEqual(['1', '2'])
  })

  test('ignores errors after a load is replaced', async () => {
    const first = Promise.withResolvers<string>()
    const loader = createLoader({
      load: (route) => {
        if (route.params.id === '1') {
          return first.promise
        }

        return 'current'
      },
    })
    const route = createRoute({ name: 'home', path: '/[id]' })
    const router = createRouter([route], { initialUrl: '/1' })
    const onError = vi.fn()
    router.onError(onError)
    await router.start()
    const result = mountConsumer(router, () => useLoader(loader))

    await router.push('/2')
    first.reject(new Error('obsolete failure'))
    await flushPromises()

    expect(onError).not.toHaveBeenCalled()
    expect(result.data.value).toBe('current')
  })

  test('ignores redirects after a load is replaced', async () => {
    const first = Promise.withResolvers<void>()
    const loader = createLoader({
      load: (route, { push }) => {
        if (route.params.id === '1' && route.state.visit !== 2) {
          return first.promise.then(() => push('/obsolete'))
        }

        return 'current'
      },
    })
    const route = createRoute({
      name: 'home',
      path: '/[id]',
      state: { visit: Number },
    })
    const router = createRouter([route], { initialUrl: '/1' })
    await router.start()
    mountConsumer(router, () => useLoader(loader))

    await router.push('/1', { state: { visit: 2 } })
    first.resolve()
    await flushPromises()

    expect(router.route.href).toBe('/1')
  })

  test('keeps loading without an error when the router stops', async () => {
    const pending = Promise.withResolvers<string>()
    const loader = createLoader({ load: () => pending.promise })
    const route = createRoute({ name: 'home', path: '/' })
    const router = createRouter([route], { initialUrl: '/' })
    await router.start()
    const result = mountConsumer(router, () => useLoader(loader))
    await flushPromises()

    router.stop()

    const { loading, error } = result
    expect(error.value).toBeUndefined()
    expect(loading.value).toBe(true)
  })

  test('navigates to routes declared by the loader', async () => {
    const home = createRoute({ name: 'home', path: '/' })
    const target = createRoute({ name: 'target', path: '/target' })
    const loader = createLoader({
      context: [target],
      load: (route, { push }) => {
        if (route.name === 'home') {
          push('target')
        }

        return 'arrived'
      },
    })
    const router = createRouter([home], { initialUrl: '/' })
    await router.start()
    const result = mountConsumer(router, () => useLoader(loader))

    await vi.waitFor(() => expect(router.route.name).toBe('target'))
    expect(result.data.value).toBe('arrived')
  })

  test('replaces the current history entry when the loader calls replace', async () => {
    const route = createRoute({ name: 'page', path: '/[page]' })
    const loader = createLoader({
      load: (route, { replace }) => {
        if (route.params.page === 'home') {
          replace('/target')
        }

        return route.params.page
      },
    })
    const router = createRouter([route], {
      initialUrl: '/previous',
      historyMode: 'memory',
    })
    await router.start()
    await router.push('/home')
    mountConsumer(router, () => useLoader(loader))

    await vi.waitFor(() => expect(router.route.href).toBe('/target'))
    router.back()
    await vi.waitFor(() => expect(router.route.href).toBe('/previous'))
  })

  test('rejects navigation with rejections declared by the loader', async () => {
    const denied = createRejection({ type: 'Denied' })
    const loader = createLoader({
      context: [denied],
      load: (_route, { reject }) => reject('Denied'),
    })
    const route = createRoute({ name: 'home', path: '/' })
    const router = createRouter([route], { initialUrl: '/' })
    const onRejection = vi.fn()
    router.onRejection(onRejection)
    await router.start()
    mountConsumer(router, () => useLoader(loader))

    await vi.waitFor(() => {
      expect(onRejection).toHaveBeenCalledExactlyOnceWith('Denied', expect.anything())
    })
  })

  test('sets error and calls the router error hook when loading fails', async () => {
    const failure = new Error('Load failed')
    const loader = createLoader({
      load: () => {
        throw failure
      },
    })
    const route = createRoute({ name: 'home', path: '/' })
    const router = createRouter([route], { initialUrl: '/' })
    const onError = vi.fn(() => true)
    router.onError(onError)
    await router.start()
    const result = mountConsumer(router, () => useLoader(loader))

    await flushPromises()

    expect(result.error.value).toBe(failure)
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure, expect.objectContaining({ source: 'loader' }))
  })
})

test('reads inline default and named loaders inherited from matched routes', async () => {
  const parent = createRoute({ path: '/parent' }).addLoader(async () => 'parent')
  const child = createRoute({ parent, name: 'child', path: '/child' })
    .addLoader(() => [1, 2], { name: 'posts' })
  const router = createRouter([child], { initialUrl: '/parent/child' })
  await router.start()
  const { inherited, posts } = mountConsumer(router, () => ({
    inherited: useLoader(router.route.loaders.default),
    posts: useLoader(router.route.loaders.posts),
  }))

  await flushPromises()
  expect(inherited.data.value).toBe('parent')
  expect(posts.data.value).toEqual([1, 2])
  router.stop()
})

test('updates inline loader data when params or query change', async () => {
  const load = vi.fn((id: string, page: string | null) => `${id}:${page}`)
  const route = createRoute({ name: 'route', path: '/[id]' })
    .addLoader((route) => load(route.params.id, route.query.get('page')))
  const router = createRouter([route], { initialUrl: '/1?page=a' })
  await router.start()
  const result = mountConsumer(router, () => useLoader(router.route.loaders.default))
  await flushPromises()
  expect(result.data.value).toBe('1:a')

  await router.push('route', { id: '2' }, { query: { page: 'a' } })
  await flushPromises()
  expect(result.data.value).toBe('2:a')

  await router.push('route', { id: '2' }, { query: { page: 'b' } })
  await flushPromises()
  expect(result.data.value).toBe('2:b')
  expect(load).toHaveBeenCalledTimes(3)
  router.stop()
})

test('reads the default loader independently of default view props', async () => {
  const route = createRoute({ name: 'route', path: '/' })
    .addView(component, { props: () => ({ value: 'props' }) })
    .addLoader(() => 'loader')
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const result = mountConsumer(router, () => useLoader(router.route.loaders.default))

  await flushPromises()
  expect(result.data.value).toBe('loader')
  router.stop()
})

test('retains settled data while another navigation waits on a guard', async () => {
  const waiting = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()
  const loader = createLoader({ load: () => 'home data' })
  const home = createRoute({ name: 'home', path: '/' }).addLoader(loader)
  const target = createRoute({ name: 'target', path: '/target' })
  target.onBeforeRouteEnter(() => {
    waiting.resolve()
    return release.promise
  })
  const router = createRouter([home, target], { initialUrl: '/' })
  await router.start()
  const result = mountConsumer(router, () => useLoader(loader))
  await flushPromises()
  expect(result.data.value).toBe('home data')

  const navigating = router.push('target')
  await waiting.promise

  expect(result.data.value).toBe('home data')
  expect(result.loading.value).toBe(false)
  release.resolve()
  await navigating
  router.stop()
})

test('reads hydrated data without rerunning the loader', async () => {
  document.body.innerHTML = payloadToScript({
    kind: 'success',
    url: '/',
    values: [{ kind: 'loader', depth: 0, name: 'default', encoded: JSON.stringify('from server') }],
  })
  const load = vi.fn(() => 'from client')
  const route = createRoute({ name: 'home', path: '/' }).addLoader(load)
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const result = mountConsumer(router, () => useLoader(router.route.loaders.default))

  await flushPromises()
  expect(result.data.value).toBe('from server')
  expect(load).not.toHaveBeenCalled()
  router.stop()
})

/**
 * A view that renders whatever the route's data resolves to, and 'loading' until it does.
 */
const dataView = defineComponent({
  setup() {
    const route = useRoute()
    const { data } = useLoader(route.loaders.default)

    return () => h('div', {}, String(data.value ?? 'loading'))
  },
})

test('a component renders before its loader settles', async () => {
  const { promise, resolve } = Promise.withResolvers<string>()

  const route = createRoute({ name: 'route', path: '/' })
    .addView(dataView)
    .addLoader(() => promise)

  const router = createRouter([route], { initialUrl: '/' })
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })

  await router.start()
  await flushPromises()

  expect(wrapper.text()).toBe('loading')

  resolve('kitbag')
  await flushPromises()

  expect(wrapper.text()).toBe('kitbag')
})

test('loader data follows navigation', async () => {
  const route = createRoute({ name: 'route', path: '/[id]' })
    .addView(dataView)
    .addLoader(async (route) => `user-${route.params.id}`)

  const router = createRouter([route], { initialUrl: '/1' })
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })

  await router.start()
  await flushPromises()

  expect(wrapper.text()).toBe('user-1')

  await router.push('route', { id: '2' })
  await flushPromises()

  expect(wrapper.text()).toBe('user-2')
})

test('a component can await data in setup under suspense', async () => {
  const { promise, resolve } = Promise.withResolvers<string>()

  const suspendingView = defineComponent({
    async setup() {
      const route = useRoute()
      const { data } = await useLoader(route.loaders.default)

      return () => h('div', {}, String(data.value))
    },
  })

  const route = createRoute({ name: 'route', path: '/' })
    .addView(suspendingView)
    .addLoader(() => promise)

  const router = createRouter([route], { initialUrl: '/' })
  const wrapper = mount({ template: '<Suspense><RouterView /></Suspense>' }, { global: { plugins: [router] } })

  await router.start()
  await flushPromises()

  expect(wrapper.text()).toBe('')

  resolve('kitbag')
  await flushPromises()

  expect(wrapper.text()).toBe('kitbag')
})

test('a view renders with its props while a loader is still running', async () => {
  const { promise, resolve } = Promise.withResolvers<string>()

  const view = defineComponent({
    props: {
      value: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const route = useRoute()
      const { data } = useLoader(route.loaders.default)

      return () => h('div', {}, `${props.value}:${data.value ?? 'loading'}`)
    },
  })

  const route = createRoute({ name: 'route', path: '/' })
    .addView(view, { props: () => ({ value: 'props' }) })
    .addLoader(() => promise)

  const router = createRouter([route], { initialUrl: '/' })
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })

  await router.start()
  await flushPromises()

  expect(wrapper.text()).toBe('props:loading')

  resolve('data')
  await flushPromises()

  expect(wrapper.text()).toBe('props:data')
})
