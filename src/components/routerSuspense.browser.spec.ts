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

test('forwards component errors to the app error handler by default', async () => {
  const failure = new Error('click failed')
  const child = defineComponent({
    setup: () => () => h('button', {
      onClick: () => {
        throw failure
      },
    }, 'ready'),
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const appErrorHandler = vi.fn()
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(child), error: errorSlot },
    global: { plugins: [router], config: { errorHandler: appErrorHandler } },
  })

  await wrapper.get('button').trigger('click')
  expect(wrapper.text()).toBe('ready')
  expect(errorSlot).not.toHaveBeenCalled()
  expect(appErrorHandler).toHaveBeenCalledTimes(1)
  expect(appErrorHandler.mock.calls[0][0]).toBe(failure)
})

test.each([
  { name: 'renders matching component errors in the error slot', accepts: true },
  { name: 'forwards unmatched component errors to the app error handler', accepts: false },
])('$name', async ({ accepts }) => {
  const failure = new Error('click failed')
  const predicate = vi.fn((error: unknown) => accepts && error === failure)
  const child = defineComponent({
    setup: () => () => h('button', {
      onClick: () => {
        throw failure
      },
    }, 'ready'),
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const appErrorHandler = vi.fn()
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const wrapper = mount(RouterSuspense, {
    props: { catch: predicate },
    slots: { default: () => h(child), error: errorSlot },
    global: { plugins: [router], config: { errorHandler: appErrorHandler } },
  })

  await wrapper.get('button').trigger('click')
  expect(predicate).toHaveBeenCalledExactlyOnceWith(failure)
  expect(wrapper.text()).toBe(accepts ? 'failed' : 'ready')
  expect(appErrorHandler).toHaveBeenCalledTimes(accepts ? 0 : 1)
})

test.each(['true', 'predicate'] as const)('forwards fallback errors to the parent boundary when catch is %s', async (mode) => {
  const pending = Promise.withResolvers<void>()
  const failure = new Error('fallback failed')
  const child = defineComponent({
    async setup() {
      await pending.promise
      return () => h('p', 'ready')
    },
  })
  const fallback = defineComponent({
    setup: () => () => {
      throw failure
    },
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const predicate = vi.fn(() => true)
  const innerErrorSlot = vi.fn(() => h('p', 'inner error'))
  const outerErrorSlot = vi.fn(() => h('p', 'outer error'))
  const appErrorHandler = vi.fn()
  const wrapper = mount(RouterSuspense, {
    props: { catch: true },
    slots: {
      default: () => h(RouterSuspense, { catch: mode === 'true' ? true : predicate }, {
        default: () => h(child),
        fallback: () => h(fallback),
        error: innerErrorSlot,
      }),
      error: outerErrorSlot,
    },
    global: { plugins: [router], config: { errorHandler: appErrorHandler } },
  })

  try {
    await flushPromises()
    expect(wrapper.text()).toBe('outer error')
    expect(outerErrorSlot).toHaveBeenCalledWith({ error: failure })
    expect(innerErrorSlot).not.toHaveBeenCalled()
    expect(predicate).not.toHaveBeenCalled()
    expect(appErrorHandler).not.toHaveBeenCalled()
  } finally {
    pending.resolve()
    await flushPromises()
  }
})

test('forwards slot function errors to the parent boundary', async () => {
  const failure = new Error('default slot failed')
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const innerErrorSlot = vi.fn(() => h('p', 'inner error'))
  const outerErrorSlot = vi.fn(() => h('p', 'outer error'))
  const appErrorHandler = vi.fn()
  const wrapper = mount(RouterSuspense, {
    props: { catch: true },
    slots: {
      default: () => h(RouterSuspense, { catch: true }, {
        default: () => {
          throw failure
        },
        error: innerErrorSlot,
      }),
      error: outerErrorSlot,
    },
    global: { plugins: [router], config: { errorHandler: appErrorHandler } },
  })

  await flushPromises()
  expect(wrapper.text()).toBe('outer error')
  expect(outerErrorSlot).toHaveBeenCalledWith({ error: failure })
  expect(innerErrorSlot).not.toHaveBeenCalled()
  expect(appErrorHandler).not.toHaveBeenCalled()
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
