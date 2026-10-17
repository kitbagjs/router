/* eslint-disable vue/one-component-per-file */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, test, vi } from 'vitest'
import { defineComponent, h, Suspense } from 'vue'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { PAYLOAD_ELEMENT_ID, payloadToScript } from '@/services/payload'
import { createLoader, createRoute, createRouter, createRouterAssets, LoaderResult, Router, useLoader } from '@/main'

enableAutoUnmount(afterEach)
afterEach(() => {
  vi.restoreAllMocks()
  document.getElementById(PAYLOAD_ELEMENT_ID)?.remove()
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

test('consumers share an attached load and can await its data', async () => {
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
  const awaited = await imported
  expect(awaited.data).toBe(imported.data)
  expect(awaited.loading).toBe(imported.loading)
  expect(awaited.error).toBe(imported.error)
  expect(awaited.data.value).toBe('loaded')
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

test('failed loads expose an error, reject when awaited, and recover on navigation', async () => {
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
  await expect(result).rejects.toBe(error)
  expect(result.error.value).toBe(error)
  expect(result.loading.value).toBe(false)

  await router.push('/2')
  expect(result.error.value).toBeUndefined()
  expect(result.data.value).toBe('recovered')
})

test('ambiguous definitions share a fallback while exact attachments reuse route data', async () => {
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
  const { first, second, selected } = mountConsumer(router, () => ({
    first: useLoader(loader),
    second: useLoader(loader),
    selected: useLoader(router.route.loaders.second),
  }))

  expect((await first).data.value).toBe(3)
  expect((await second).data.value).toBe(3)
  expect(first.error.value).toBeUndefined()
  expect((await selected).data.value).toBe(await router.route.data.second)
  expect(load).toHaveBeenCalledTimes(3)
  expect(warn).toHaveBeenCalledTimes(1)
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('multiple attachments for this loader on route "home": "first", "second"'), loader)
})

test('router assets read the same definition from their own router stores', async () => {
  const loader = createLoader({ load: (route) => String(route.params.id) })
  const route = createRoute({ name: 'user', path: '/[id]' }).addLoader(loader)
  const first = createRouter([route], { initialUrl: '/1', isGlobalRouter: false })
  const second = createRouter([route], { initialUrl: '/2', isGlobalRouter: false })
  await Promise.all([first.start(), second.start()])
  const results = [first, second].map((router) => {
    const assets = createRouterAssets(router)
    return mountConsumer(router, () => assets.useLoader(loader))
  })

  expect((await results[0]).data.value).toBe('1')
  expect((await results[1]).data.value).toBe('2')
})

test('fallback hydration warnings are shared and stop after the hydrated navigation', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  document.body.insertAdjacentHTML('beforeend', payloadToScript({
    kind: 'success',
    url: '/1',
    values: [],
  }))
  const loader = createLoader({ load: (route) => route.params.id })
  const route = createRoute({ name: 'user', path: '/[id]' })
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const { first, second } = mountConsumer(router, () => ({
    first: useLoader(loader),
    second: useLoader(loader),
  }))

  expect((await first).data.value).toBe('1')
  expect((await second).data.value).toBe('1')
  expect(warn).toHaveBeenCalledTimes(2)
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('not included in the SSR payload'), loader)

  await router.push('/2')
  expect((await first).data.value).toBe('2')
  expect(warn).toHaveBeenCalledTimes(3)
  expect(warn).toHaveBeenLastCalledWith(expect.stringContaining('not attached'), loader)
})

test('fallback consumers share a navigation load and abandon it on navigation or unmount', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const first = Promise.withResolvers<string>()
  const second = Promise.withResolvers<string>()
  const signals: AbortSignal[] = []
  const params: unknown[] = []
  const load = vi.fn((route, { signal }) => {
    signals.push(signal)
    const pending = route.params.id === '1' ? first.promise : second.promise
    return pending.then((data) => {
      params.push(route.params.id)
      return data
    })
  })
  const loader = createLoader({ load })
  const route = createRoute({ name: 'home', path: '/[id]' })
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  let firstConsumer!: LoaderResult<string>
  let secondConsumer!: LoaderResult<string>
  const wrapper = mount(defineComponent(() => {
    firstConsumer = useLoader(loader)
    secondConsumer = useLoader(loader)
    return () => h('div', secondConsumer.data.value ?? 'loading')
  }), { global: { plugins: [router] } })

  expect(firstConsumer.loading.value).toBe(true)
  expect(load).toHaveBeenCalledTimes(1)
  expect(warn).toHaveBeenCalledTimes(1)
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('not attached'), loader)
  const abandoned = expect(Promise.resolve(firstConsumer)).rejects.toBeInstanceOf(NavigationAbandonedError)
  await flushPromises()
  await router.push('/2')
  await abandoned
  expect(signals[0].aborted).toBe(true)
  expect(load).toHaveBeenCalledTimes(2)
  expect(warn).toHaveBeenCalledTimes(2)

  first.resolve('obsolete')
  await flushPromises()
  expect(secondConsumer.data.value).toBeUndefined()
  second.resolve('current')
  await flushPromises()
  expect(wrapper.text()).toBe('current')
  expect((await firstConsumer).data.value).toBe('current')
  expect(secondConsumer.error.value).toBeUndefined()
  expect(params).toEqual(['1', '2'])

  wrapper.unmount()
  expect(signals[1].aborted).toBe(true)
})

test('stopping the router cancels a pending fallback without restarting it', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const pending = Promise.withResolvers<string>()
  const load = vi.fn(() => pending.promise)
  const loader = createLoader({ load })
  const route = createRoute({ name: 'home', path: '/' })
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  let result!: LoaderResult<string>
  const wrapper = mount(defineComponent(() => {
    result = useLoader(loader)
    return () => h('div')
  }), { global: { plugins: [router] } })
  expect(result.loading.value).toBe(true)

  router.stop()

  expect(result.loading.value).toBe(false)
  expect(result.error.value).toBeInstanceOf(NavigationAbandonedError)
  await expect(result).rejects.toBeInstanceOf(NavigationAbandonedError)
  expect(load).toHaveBeenCalledTimes(1)
  wrapper.unmount()
})

test('fallback context is registered and navigation helpers use the router response handling', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
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
  const wrapper = mount(defineComponent(() => {
    const result = useLoader(loader)
    return () => h('div', result.data.value)
  }), { global: { plugins: [router] } })

  await vi.waitFor(() => expect(router.route.name).toBe('target'))
  await flushPromises()
  expect(wrapper.text()).toBe('arrived')
  wrapper.unmount()
})
