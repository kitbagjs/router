/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createRoute, createRouter, createRouterAssets, RouterSuspense } from '@/main'

test('renders the loading slot while async setup is pending', async () => {
  const pending = Promise.withResolvers<void>()
  const child = defineComponent({
    async setup() {
      await pending.promise
      return () => h('p', 'ready')
    },
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const wrapper = mount(RouterSuspense, {
    slots: {
      default: () => h(child),
      fallback: () => h('p', 'loading'),
    },
    global: { plugins: [router] },
  })

  expect(wrapper.text()).toBe('loading')
  pending.resolve()
  await flushPromises()
  expect(wrapper.text()).toBe('ready')
})

test.each([new Error('failed'), undefined, null, false])('passes the original async setup failure %s to the error slot', async (failure) => {
  const pending = Promise.withResolvers<void>()
  const child = defineComponent({
    async setup() {
      await pending.promise
      throw failure
    },
    render: () => null,
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const appError = vi.fn()
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(child), error: errorSlot },
    global: { plugins: [router], config: { errorHandler: appError } },
  })

  pending.resolve()
  await flushPromises()
  expect(wrapper.text()).toBe('failed')
  expect(errorSlot).toHaveBeenCalledWith({ error: failure })
  expect(appError).not.toHaveBeenCalled()
})

test('renders a generic error state when there is no error slot', async () => {
  const child = defineComponent({
    setup: () => () => {
      throw new Error('private failure details')
    },
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const wrapper = mount(RouterSuspense, { slots: { default: () => h(child) }, global: { plugins: [router] } })

  await flushPromises()
  expect(wrapper.get('[role="alert"]').text()).toBe('Unable to load this content.')
})

test('the nearest boundary handles the error', async () => {
  const child = defineComponent({
    setup: () => () => {
      throw new Error('failed')
    },
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const outerError = vi.fn(() => h('p', 'outer error'))
  const wrapper = mount(RouterSuspense, {
    slots: {
      default: () => h(RouterSuspense, null, {
        default: () => h(child),
        error: () => h('p', 'inner error'),
      }),
      error: outerError,
    },
    global: { plugins: [router] },
  })

  await flushPromises()
  expect(wrapper.text()).toBe('inner error')
  expect(outerError).not.toHaveBeenCalled()
})

test('refresh resets the error and remounts the content at the same URL', async () => {
  const setup = vi.fn()
  let failed = true
  const child = defineComponent({
    setup() {
      setup()
      return () => {
        if (failed) {
          throw new Error('failed')
        }

        return h('p', 'recovered')
      }
    },
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(child), error: () => h('p', 'failed') },
    global: { plugins: [router] },
  })
  await flushPromises()

  failed = false
  router.refresh()
  await flushPromises()
  expect(wrapper.text()).toBe('recovered')
  expect(setup).toHaveBeenCalledTimes(2)
})

test('an error in the error slot reaches the outer boundary', async () => {
  const child = defineComponent({
    setup: () => () => {
      throw new Error('content failed')
    },
  })
  const failure = new Error('error view failed')
  const errorView = defineComponent({
    setup: () => () => {
      throw failure
    },
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const outerError = vi.fn(() => h('p', 'outer error'))
  const wrapper = mount(RouterSuspense, {
    slots: {
      default: () => h(RouterSuspense, null, {
        default: () => h(child),
        error: () => h(errorView),
      }),
      error: outerError,
    },
    global: { plugins: [router] },
  })
  await flushPromises()

  expect(wrapper.text()).toBe('outer error')
  expect(outerError).toHaveBeenCalledWith({ error: failure })
})

test('an aborted navigation keeps the current error state', async () => {
  const route = createRoute({ name: 'home', path: '/[id]' })
  route.onBeforeRouteUpdate((_to, { abort }) => abort())
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const child = defineComponent({
    setup: () => () => {
      throw new Error('failed')
    },
  })
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(child), error: errorSlot },
    global: { plugins: [router] },
  })
  await flushPromises()
  await router.push('/2')

  expect(wrapper.text()).toBe('failed')
  expect(errorSlot).toHaveBeenCalledTimes(1)
})

test('router assets reset only for their own router', async () => {
  const route = createRoute({ name: 'home', path: '/' })
  const first = createRouter([route], { initialUrl: '/', isGlobalRouter: false })
  const second = createRouter([route], { initialUrl: '/', isGlobalRouter: false })
  await Promise.all([first.start(), second.start()])
  const assets = createRouterAssets(first)
  const setup = vi.fn()
  const child = defineComponent({
    setup() {
      setup()
      return () => {
        throw new Error('failed')
      }
    },
  })
  mount(assets.RouterSuspense, {
    slots: { default: () => h(child) },
    global: { plugins: [first, second] },
  })
  await flushPromises()
  second.refresh()
  await flushPromises()
  expect(setup).toHaveBeenCalledTimes(1)
  first.refresh()
  await flushPromises()
  expect(setup).toHaveBeenCalledTimes(2)
})
