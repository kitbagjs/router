/* eslint-disable vue/one-component-per-file */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, test, vi } from 'vitest'
import { defineComponent, h, Suspense } from 'vue'
import { createLoader, createRoute, createRouter, createRouterAssets, Router, useLoader } from '@/main'

enableAutoUnmount(afterEach)

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

test('route definitions select a specific attachment when a reusable definition is ambiguous', async () => {
  const load = vi.fn<() => number>()
    .mockReturnValueOnce(1)
    .mockReturnValueOnce(2)
  const loader = createLoader({ load })
  const route = createRoute({ name: 'home', path: '/' })
    .addLoader(loader, { name: 'first' })
    .addLoader(loader, { name: 'second' })
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const { ambiguous, selected } = mountConsumer(router, () => ({
    ambiguous: useLoader(loader),
    selected: useLoader(router.route.loaders.second),
  }))

  await expect(ambiguous).rejects.toThrow('multiple attachments')
  expect((await selected).data.value).toBe(await router.route.data.second)
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
