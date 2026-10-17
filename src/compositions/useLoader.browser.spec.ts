import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, test, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createLoader, createRoute, createRouter, createRouterAssets, Router, useLoader } from '@/main'

enableAutoUnmount(afterEach)
afterEach(() => vi.restoreAllMocks())

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
  await expect(imported).resolves.toBe('loaded')
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
  const data = Promise.resolve(result)
  entering.resolve()
  await expect(data).resolves.toBe(42)
})

test('a mounted consumer follows navigation and clears data while loading', async () => {
  const pending = Promise.withResolvers<string>()
  const loader = createLoader({
    load: (route) => {
      return route.params.id === '1' ? 'first' : pending.promise
    },
  })
  const route = createRoute({ name: 'user', path: '/[id]' }).addLoader(loader)
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const result = mountConsumer(router, () => useLoader(loader))

  expect(result.data.value).toBe('first')
  await router.push('/2')
  expect(result.loading.value).toBe(true)
  expect(result.data.value).toBeUndefined()

  pending.resolve('second')
  await flushPromises()
  expect(result.data.value).toBe('second')
  expect(result.loading.value).toBe(false)
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

  await expect(first).resolves.toBe(3)
  await expect(second).resolves.toBe(3)
  expect(first.error.value).toBeUndefined()
  await expect(selected).resolves.toBe(await router.route.data.second)
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

  await expect(results[0]).resolves.toBe('1')
  await expect(results[1]).resolves.toBe('2')
})
