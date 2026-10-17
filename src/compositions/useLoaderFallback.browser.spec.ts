import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, test, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { createLoader, createRoute, createRouter, LoaderResult, useLoader } from '@/main'

afterEach(() => vi.restoreAllMocks())

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
  await expect(firstConsumer).resolves.toBe('current')
  expect(secondConsumer.error.value).toBeUndefined()
  expect(params).toEqual(['1', '2'])

  wrapper.unmount()
  expect(signals[1].aborted).toBe(true)
  warn.mockRestore()
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
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
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
  warn.mockRestore()
})
