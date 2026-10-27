/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { Component, defineComponent, h, VNode } from 'vue'
import { createRoute, createRouter, createRouterAssets, RouterSuspense } from '@/main'

function createRenderErrorComponent(error: unknown = new Error('failed')): Component {
  return defineComponent({
    setup: () => () => {
      throw error
    },
  })
}

test('renders the fallback slot until async setup resolves', async () => {
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

test.each([
  { name: 'Error', error: new Error('failed') },
  { name: 'undefined', error: undefined },
  { name: 'null', error: null },
  { name: 'false', error: false },
])('renders the error slot with the original $name', async ({ error }) => {
  const child = defineComponent({
    async setup() {
      throw error
    },
    render: () => null,
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const errorSlot = vi.fn<(props: { error: unknown }) => VNode>(() => h('p', 'failed'))
  const appErrorHandler = vi.fn()
  const wrapper = mount(RouterSuspense, {
    props: { catch: true },
    slots: { default: () => h(child), error: errorSlot },
    global: { plugins: [router], config: { errorHandler: appErrorHandler } },
  })

  await flushPromises()
  expect(wrapper.text()).toBe('failed')
  expect(errorSlot).toHaveBeenCalledTimes(1)
  expect(errorSlot.mock.calls[0][0].error).toBe(error)
  expect(appErrorHandler).not.toHaveBeenCalled()
})

test('renders a generic error when no error slot is provided', async () => {
  const child = createRenderErrorComponent(new Error('private failure details'))
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const wrapper = mount(RouterSuspense, {
    props: { catch: true },
    slots: { default: () => h(child) },
    global: { plugins: [router] },
  })

  await flushPromises()
  expect(wrapper.get('[role="alert"]').text()).toBe('Unable to load this content.')
})

test('renders errors in the nearest boundary', async () => {
  const child = createRenderErrorComponent()
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const outerErrorSlot = vi.fn(() => h('p', 'outer error'))
  const wrapper = mount(RouterSuspense, {
    props: { catch: true },
    slots: {
      default: () => h(RouterSuspense, { catch: true }, {
        default: () => h(child),
        error: () => h('p', 'inner error'),
      }),
      error: outerErrorSlot,
    },
    global: { plugins: [router] },
  })

  await flushPromises()
  expect(wrapper.text()).toBe('inner error')
  expect(outerErrorSlot).not.toHaveBeenCalled()
})

test('retries content after the route is refreshed', async () => {
  const onSetup = vi.fn()
  let shouldFail = true
  const child = defineComponent({
    setup() {
      onSetup()
      return () => {
        if (shouldFail) {
          throw new Error('failed')
        }

        return h('p', 'recovered')
      }
    },
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const wrapper = mount(RouterSuspense, {
    props: { catch: true },
    slots: { default: () => h(child), error: () => h('p', 'failed') },
    global: { plugins: [router] },
  })
  await flushPromises()
  expect(wrapper.text()).toBe('failed')
  expect(onSetup).toHaveBeenCalledTimes(1)

  shouldFail = false
  router.refresh()
  await flushPromises()
  expect(wrapper.text()).toBe('recovered')
  expect(onSetup).toHaveBeenCalledTimes(2)
})

test('renders error slot failures in the parent boundary', async () => {
  const child = createRenderErrorComponent(new Error('content failed'))
  const failure = new Error('error view failed')
  const errorView = createRenderErrorComponent(failure)
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const outerErrorSlot = vi.fn(() => h('p', 'outer error'))
  const wrapper = mount(RouterSuspense, {
    props: { catch: true },
    slots: {
      default: () => h(RouterSuspense, { catch: true }, {
        default: () => h(child),
        error: () => h(errorView),
      }),
      error: outerErrorSlot,
    },
    global: { plugins: [router] },
  })
  await flushPromises()

  expect(wrapper.text()).toBe('outer error')
  expect(outerErrorSlot).toHaveBeenCalledWith({ error: failure })
})

test('preserves the error state after aborted navigation', async () => {
  const route = createRoute({ name: 'home', path: '/[id]' })
  route.onBeforeRouteUpdate((_to, { abort }) => abort())
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const child = createRenderErrorComponent()
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const wrapper = mount(RouterSuspense, {
    props: { catch: true },
    slots: { default: () => h(child), error: errorSlot },
    global: { plugins: [router] },
  })
  await flushPromises()
  expect(wrapper.text()).toBe('failed')

  await router.push('/2')

  expect(wrapper.text()).toBe('failed')
  expect(errorSlot).toHaveBeenCalledTimes(1)
})

test('retries content only when its own router refreshes', async () => {
  const route = createRoute({ name: 'home', path: '/' })
  const first = createRouter([route], { initialUrl: '/', isGlobalRouter: false })
  const second = createRouter([route], { initialUrl: '/', isGlobalRouter: false })
  await Promise.all([first.start(), second.start()])
  const assets = createRouterAssets(first)
  const onSetup = vi.fn()
  const child = defineComponent({
    setup() {
      onSetup()
      return () => {
        throw new Error('failed')
      }
    },
  })
  mount(assets.RouterSuspense, {
    props: { catch: true },
    slots: { default: () => h(child) },
    global: { plugins: [first, second] },
  })
  await flushPromises()
  second.refresh()
  await flushPromises()
  expect(onSetup).toHaveBeenCalledTimes(1)
  first.refresh()
  await flushPromises()
  expect(onSetup).toHaveBeenCalledTimes(2)
})
