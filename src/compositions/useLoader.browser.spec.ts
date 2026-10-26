/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, onErrorCaptured, shallowRef, Suspense } from 'vue'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { createLoader, createRejection, createRoute, createRouter, createRouterAssets, Router, useLoader } from '@/main'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
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

test('consumers share the route load', async () => {
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
  const resolved = await imported
  expect(resolved.data.value).toBe('loaded')
  expect(resolved.data).toBe(imported.data)
  expect(resolved.loading).toBe(imported.loading)
  expect(resolved.error).toBe(imported.error)
  expect(attached.data.value).toBe('loaded')
  expect(attached.loading.value).toBe(false)
  expect(load).toHaveBeenCalledTimes(1)
})

test('awaiting a loader waits for the initial navigation', async () => {
  const entering = Promise.withResolvers<void>()
  const loader = createLoader({ load: () => 42 })
  const route = createRoute({ name: 'home', path: '/' }).addLoader(loader)
  route.onBeforeRouteEnter(() => entering.promise)
  const router = createRouter([route], { initialUrl: '/' })
  const result = mountConsumer(router, () => useLoader(loader))

  expect(result.loading.value).toBe(true)
  const ready = Promise.resolve(result)
  entering.resolve()
  expect((await ready).data.value).toBe(42)
})

test('awaited loader refs remain reactive after Suspense resolves', async () => {
  const first = Promise.withResolvers<string>()
  const second = Promise.withResolvers<string>()
  const loader = createLoader({
    load: (route) => {
      return route.params.id === '1' ? first.promise : second.promise
    },
  })
  const route = createRoute({ name: 'user', path: '/[id]' }).addLoader(loader)
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const consumer = defineComponent({
    async setup() {
      const { data, loading } = await useLoader(loader)

      return () => h('div', loading.value ? 'loading' : data.value)
    },
  })
  const wrapper = mount(defineComponent({
    render: () => h(Suspense, null, {
      default: () => h(consumer),
      fallback: () => h('div', 'suspended'),
    }),
  }), { global: { plugins: [router] } })

  expect(wrapper.text()).toBe('suspended')
  first.resolve('first')
  await flushPromises()
  expect(wrapper.text()).toBe('first')

  await router.push('/2')
  expect(wrapper.text()).toBe('loading')
  second.resolve('second')
  await flushPromises()
  expect(wrapper.text()).toBe('second')
})

test('awaiting a failed load rejects with the original error and the refs stay reactive through recovery', async () => {
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

  const rejected = expect(Promise.resolve(result)).rejects.toBe(error)
  pending.reject(error)
  await rejected
  const { data, loading, error: failure } = result
  expect(failure.value).toBe(error)
  expect(data.value).toBeUndefined()
  expect(loading.value).toBe(false)

  await router.push('/2')
  expect(failure.value).toBeUndefined()
  expect(data.value).toBe('recovered')
})

test.each(['throw', 'reject'] as const)('awaiting a loader propagates its original %s value', async (action) => {
  const failure = new Error('loader failed')
  const loader = createLoader({
    load: () => {
      if (action === 'throw') {
        throw failure
      }

      return Promise.reject<string>(failure)
    },
  })
  const route = createRoute({ name: 'home', path: '/' }).addLoader(loader)
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const result = mountConsumer(router, () => useLoader(loader))

  await expect(result).rejects.toBe(failure)
})

test('a non-awaited loader exposes failure through its error ref', async () => {
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

test.each([true, false])('an uncaught awaited failure in async setup reaches the parent error boundary with attached=%s', async (attached) => {
  const pending = Promise.withResolvers<string>()
  const loader = createLoader({ load: () => pending.promise })
  const home = createRoute({ name: 'home', path: '/' })
  const route = attached ? home.addLoader(loader) : home
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const captured = vi.fn()
  const appError = vi.fn()
  const consumer = defineComponent({
    async setup() {
      const { data } = await useLoader(loader)

      return () => h('p', data.value)
    },
  })
  const wrapper = mount(defineComponent({
    setup() {
      const failed = shallowRef(false)
      onErrorCaptured((error) => {
        captured(error)
        failed.value = true
        return false
      })

      return () => {
        if (failed.value) {
          return h('p', 'failed')
        }

        return h(Suspense, null, {
          default: () => h(consumer),
          fallback: () => h('p', 'loading'),
        })
      }
    },
  }), { global: { plugins: [router], config: { errorHandler: appError } } })

  expect(wrapper.text()).toBe('loading')
  const failure = new Error('request failed')
  pending.reject(failure)
  await flushPromises()

  expect(captured).toHaveBeenCalledExactlyOnceWith(failure)
  expect(wrapper.text()).toBe('failed')
  expect(appError).not.toHaveBeenCalled()
})

test.each([true, false])('after a successful await a later failure updates the refs without rejecting again with attached=%s', async (attached) => {
  const pending = Promise.withResolvers<string>()
  const loader = createLoader({
    load: (route) => {
      return route.params.id === '1' ? 'loaded' : pending.promise
    },
  })
  const user = createRoute({ name: 'user', path: '/[id]' })
  const route = attached ? user.addLoader(loader) : user
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const result = mountConsumer(router, () => useLoader(loader))
  const fulfilled = vi.fn()
  const rejected = vi.fn()
  const ready = Promise.resolve(result)
  void ready.then(fulfilled, rejected)
  const resolved = await ready

  await router.push('/2')
  expect(resolved.loading.value).toBe(true)
  const failure = new Error('later failure')
  pending.reject(failure)
  await flushPromises()

  expect(resolved.error.value).toBe(failure)
  expect(resolved.data.value).toBeUndefined()
  expect(resolved.loading.value).toBe(false)
  expect(fulfilled).toHaveBeenCalledExactlyOnceWith(resolved)
  expect(rejected).not.toHaveBeenCalled()
  expect(await ready).toBe(resolved)
})

test('route definitions select a named attachment', async () => {
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

  expect((await selected).data.value).toBe(await router.route.data.second)
})

test('router assets read the same definition from their own router stores', async () => {
  const loader = createLoader({ load: (route) => String(route.params.id) })
  const route = createRoute({ name: 'user', path: '/[id]' }).addLoader(loader)
  const first = createRouter([route], { initialUrl: '/1', isGlobalRouter: false })
  const second = createRouter([route], { initialUrl: '/2', isGlobalRouter: false })
  await Promise.all([first.start(), second.start()])
  const firstAssets = createRouterAssets(first)
  const secondAssets = createRouterAssets(second)
  const firstResult = mountConsumer(first, () => firstAssets.useLoader(loader))
  const secondResult = mountConsumer(second, () => secondAssets.useLoader(loader))

  expect((await firstResult).data.value).toBe('1')
  expect((await secondResult).data.value).toBe('2')
})

describe('fallback loads', () => {
  test('same-URL navigation selects the new load', async () => {
    const load = vi.fn<() => number>()
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2)
    const loader = createLoader({ load })
    const route = createRoute({ name: 'home', path: '/' })
    const router = createRouter([route], { initialUrl: '/' })
    await router.start()
    const result = mountConsumer(router, () => useLoader(loader))

    expect((await result).data.value).toBe(1)
    await router.push('/')
    await flushPromises()

    expect(result.data.value).toBe(2)
    expect(load).toHaveBeenCalledTimes(2)
  })

  test('unmounted consumers stop starting fallback loads', async () => {
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

  test('unattached consumers share a load and a warning', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
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
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not attached'), loader)

    pending.resolve('loaded')
    expect((await first).data.value).toBe('loaded')
    expect((await second).data.value).toBe('loaded')
  })

  test('ambiguous definitions warn with their attachment names and run separately', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
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

    expect((await result).data.value).toBe(3)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('route "home": "first", "second"'), loader)
  })

  test('navigation replaces fallback loads and preserves their route snapshots', async () => {
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
    const settled = expect(Promise.resolve(result)).rejects.toBeInstanceOf(NavigationAbandonedError)
    await flushPromises()

    await router.push('/2')
    await settled
    expect(signals[0].aborted).toBe(true)

    first.resolve('obsolete')
    await flushPromises()
    expect(result.data.value).toBeUndefined()

    second.resolve('current')
    expect((await result).data.value).toBe('current')
    expect(params).toEqual(['1', '2'])
  })

  test('superseded fallback failures do not reach router error hooks', async () => {
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

  test('superseded fallback redirects are ignored after same-URL navigation', async () => {
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

  test('stopping the router settles a pending await with an abandonment error', async () => {
    const pending = Promise.withResolvers<string>()
    const loader = createLoader({ load: () => pending.promise })
    const route = createRoute({ name: 'home', path: '/' })
    const router = createRouter([route], { initialUrl: '/' })
    await router.start()
    const result = mountConsumer(router, () => useLoader(loader))
    const settled = expect(Promise.resolve(result)).rejects.toBeInstanceOf(NavigationAbandonedError)
    await flushPromises()

    router.stop()

    await settled
    const { loading, error } = result
    expect(error.value).toBeInstanceOf(NavigationAbandonedError)
    expect(loading.value).toBe(false)
  })

  test('fallback loaders can navigate to routes in their context', async () => {
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
    expect((await result).data.value).toBe('arrived')
  })

  test('fallback loaders replace the current history entry', async () => {
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

  test('fallback loaders can reject with their declared context', async () => {
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

  test.each([true, false])('fallback failures reach the loader state and router error hooks with awaited=%s', async (awaited) => {
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

    if (awaited) {
      await expect(result).rejects.toBe(failure)
    } else {
      await flushPromises()
    }

    expect(result.error.value).toBe(failure)
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure, expect.objectContaining({ source: 'loader' }))
  })
})
