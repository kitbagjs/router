/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { defineComponent, h, onErrorCaptured, Suspense } from 'vue'
import { createLoader, createRoute, createRouter, RouterSuspense, UseLoader, UseLoaderResolved, useLoader } from '@/main'

const loaderAttachments = [
  { attachment: 'attached', attached: true },
  { attachment: 'fallback', attached: false },
]

test.each(loaderAttachments)('retains data while the next load is pending ($attachment loader)', async ({ attached }) => {
  const first = Promise.withResolvers<string>()
  const second = Promise.withResolvers<string>()
  const loader = createLoader({
    load: (route) => {
      return route.params.id === '1' ? first.promise : second.promise
    },
  })
  const user = createRoute({ name: 'user', path: '/[id]' })
  const route = attached ? user.addLoader(loader) : user
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  let state: UseLoader<string> | undefined
  let loaded: UseLoaderResolved<string> | undefined
  const consumer = defineComponent({
    async setup() {
      state = useLoader(loader)
      loaded = await state
      const { data } = loaded
      return () => h('p', data.value)
    },
  })
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(consumer), fallback: () => h('p', 'waiting') },
    global: { plugins: [router] },
  })

  expect(wrapper.text()).toBe('waiting')
  first.resolve('first')
  await flushPromises()
  expect(wrapper.text()).toBe('first')
  expect(loaded).not.toHaveProperty('error')
  expect(loaded?.loading).toBe(state?.loading)

  await router.push('/2')
  expect(loaded?.data.value).toBe('first')
  expect(loaded?.loading.value).toBe(true)
  expect(state?.data.value).toBeUndefined()
  expect(wrapper.text()).toBe('first')

  second.resolve('second')
  await flushPromises()
  expect(wrapper.text()).toBe('second')
  expect(loaded?.loading.value).toBe(false)
})

test.each(['throw', 'reject'] as const)('rejects with the original loader error (%s)', async (action) => {
  const failure = new Error('failed')
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
  let state: UseLoader<string> | undefined
  mount(defineComponent({
    setup() {
      state = useLoader(loader)
      return () => null
    },
  }), { global: { plugins: [router] } })

  await expect(state).rejects.toBe(failure)
})

test.each(loaderAttachments)('shows the error slot when the initial load fails ($attachment loader)', async ({ attached }) => {
  const pending = Promise.withResolvers<string>()
  const loader = createLoader({ load: () => pending.promise })
  const home = createRoute({ name: 'home', path: '/' })
  const route = attached ? home.addLoader(loader) : home
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const consumer = defineComponent({
    async setup() {
      const { data } = await useLoader(loader)
      return () => h('p', data.value)
    },
  })
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const appError = vi.fn()
  const predicate = vi.fn(() => false)
  const wrapper = mount(RouterSuspense, {
    props: { props: false, catch: predicate },
    slots: { default: () => h(consumer), fallback: () => h('p', 'waiting'), error: errorSlot },
    global: { plugins: [router], config: { errorHandler: appError } },
  })
  const failure = new Error('failed')
  pending.reject(failure)
  await flushPromises()

  expect(wrapper.text()).toBe('failed')
  expect(errorSlot).toHaveBeenCalledWith({ error: failure })
  expect(appError).not.toHaveBeenCalled()
  expect(predicate).not.toHaveBeenCalled()
})

test.each(loaderAttachments)('reports later errors even when data is not read ($attachment loader)', async ({ attached }) => {
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
  const consumer = defineComponent({
    async setup() {
      await useLoader(loader)
      return () => h('p', 'ready')
    },
  })
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const appError = vi.fn()
  const predicate = vi.fn(() => false)
  const wrapper = mount(RouterSuspense, {
    props: { props: false, catch: predicate },
    slots: { default: () => h(consumer), error: errorSlot },
    global: { plugins: [router], config: { errorHandler: appError } },
  })
  await flushPromises()
  expect(wrapper.text()).toBe('ready')

  await router.push('/2')
  const failure = new Error('later failure')
  pending.reject(failure)
  await flushPromises()
  expect(wrapper.text()).toBe('failed')
  expect(errorSlot).toHaveBeenCalledWith({ error: failure })
  expect(appError).not.toHaveBeenCalled()
  expect(predicate).not.toHaveBeenCalled()
})

test('shows synchronous load errors after navigation', async () => {
  const failure = new Error('later failure')
  const loader = createLoader({
    load: (route) => {
      if (route.params.id === '2') {
        throw failure
      }

      return 'loaded'
    },
  })
  const route = createRoute({ name: 'user', path: '/[id]' }).addLoader(loader)
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const consumer = defineComponent({
    async setup() {
      await useLoader(loader)
      return () => h('p', 'ready')
    },
  })
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(consumer), error: errorSlot },
    global: { plugins: [router] },
  })
  await flushPromises()
  await router.push('/2')
  await flushPromises()

  expect(wrapper.text()).toBe('failed')
  expect(errorSlot).toHaveBeenCalledWith({ error: failure })
})

test.each(loaderAttachments)('reloads failed data and clears the error on refresh ($attachment loader)', async ({ attached }) => {
  const failure = new Error('failed')
  const load = vi.fn<() => Promise<string>>()
    .mockRejectedValueOnce(failure)
    .mockResolvedValue('recovered')
  const loader = createLoader({ load })
  const home = createRoute({ name: 'home', path: '/' })
  const route = attached ? home.addLoader(loader) : home
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const consumer = defineComponent({
    async setup() {
      const { data } = await useLoader(loader)
      return () => h('p', data.value)
    },
  })
  const wrapper = mount(RouterSuspense, {
    slots: {
      default: () => h(consumer),
      error: () => h('button', { onClick: () => router.refresh() }, 'retry'),
    },
    global: { plugins: [router] },
  })
  await flushPromises()
  expect(wrapper.text()).toBe('retry')
  await wrapper.get('button').trigger('click')
  await flushPromises()

  expect(wrapper.text()).toBe('recovered')
  expect(load).toHaveBeenCalledTimes(2)
})

test('uses the error ref when the result is not awaited', async () => {
  const pending = Promise.withResolvers<string>()
  const loader = createLoader({ load: () => pending.promise })
  const route = createRoute({ name: 'home', path: '/' }).addLoader(loader)
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const consumer = defineComponent({
    setup() {
      const { data, error } = useLoader(loader)
      return () => h('p', error.value ? 'handled locally' : data.value)
    },
  })
  const errorSlot = vi.fn(() => h('p', 'boundary'))
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(consumer), error: errorSlot },
    global: { plugins: [router] },
  })
  pending.reject(new Error('failed'))
  await flushPromises()

  expect(wrapper.text()).toBe('handled locally')
  expect(errorSlot).not.toHaveBeenCalled()
})

test('reports later errors to Vue error handlers', async () => {
  const pending = Promise.withResolvers<string>()
  const loader = createLoader({
    load: (route) => {
      return route.params.id === '1' ? 'loaded' : pending.promise
    },
  })
  const route = createRoute({ name: 'user', path: '/[id]' }).addLoader(loader)
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const captured = vi.fn()
  const consumer = defineComponent({
    async setup() {
      await useLoader(loader)
      return () => null
    },
  })
  mount(defineComponent({
    setup() {
      onErrorCaptured((error) => {
        captured(error)
        return false
      })
      return () => h(Suspense, null, { default: () => h(consumer) })
    },
  }), { global: { plugins: [router] } })
  await flushPromises()
  await router.push('/2')
  const failure = new Error('later failure')
  pending.reject(failure)
  await flushPromises()

  expect(captured).toHaveBeenCalledExactlyOnceWith(failure)
})

test('stops reporting errors when the component unmounts', async () => {
  const pending = Promise.withResolvers<string>()
  const loader = createLoader({
    load: (route) => {
      return route.params.id === '1' ? 'loaded' : pending.promise
    },
  })
  const route = createRoute({ name: 'user', path: '/[id]' }).addLoader(loader)
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const consumer = defineComponent({
    async setup() {
      await useLoader(loader)
      return () => null
    },
  })
  const appError = vi.fn()
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(consumer) },
    global: { plugins: [router], config: { errorHandler: appError } },
  })
  await flushPromises()
  await router.push('/2')
  wrapper.unmount()
  pending.reject(new Error('obsolete failure'))
  await flushPromises()

  expect(appError).not.toHaveBeenCalled()
})

test('keeps component errors out of the error state after loading succeeds', async () => {
  const failure = new Error('click failed')
  const loader = createLoader({ load: () => 'loaded' })
  const route = createRoute({ name: 'home', path: '/' }).addLoader(loader)
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const consumer = defineComponent({
    async setup() {
      const { data } = await useLoader(loader)
      return () => h('button', {
        onClick: () => {
          throw failure
        },
      }, data.value)
    },
  })
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const appError = vi.fn()
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(consumer), error: errorSlot },
    global: { plugins: [router], config: { errorHandler: appError } },
  })
  await flushPromises()
  await wrapper.get('button').trigger('click')

  expect(wrapper.text()).toBe('loaded')
  expect(errorSlot).not.toHaveBeenCalled()
  expect(appError.mock.calls[0][0]).toBe(failure)
})
