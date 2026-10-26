/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { Component, defineComponent, h } from 'vue'
import { createRoute, createRouter, createRouterAssets, RouterSuspense } from '@/main'

function createFailingComponent(error: unknown = new Error('failed')): Component {
  return defineComponent({
    setup: () => () => {
      throw error
    },
  })
}

test('shows fallback while setup is pending', async () => {
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
  { name: 'an Error', error: new Error('failed') },
  { name: 'undefined', error: undefined },
  { name: 'null', error: null },
  { name: 'false', error: false },
])('passes $name to the error slot', async ({ error }) => {
  const child = defineComponent({
    async setup() {
      throw error
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

  await flushPromises()
  expect(wrapper.text()).toBe('failed')
  expect(errorSlot).toHaveBeenCalledWith({ error })
  expect(appError).not.toHaveBeenCalled()
})

test('shows a default error when no error slot is provided', async () => {
  const child = createFailingComponent(new Error('private failure details'))
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const wrapper = mount(RouterSuspense, { slots: { default: () => h(child) }, global: { plugins: [router] } })

  await flushPromises()
  expect(wrapper.get('[role="alert"]').text()).toBe('Unable to load this content.')
})

test('handles errors in the nearest boundary', async () => {
  const child = createFailingComponent()
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

test('remounts content when the route is refreshed', async () => {
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

test('passes error slot failures to the parent boundary', async () => {
  const child = createFailingComponent(new Error('content failed'))
  const failure = new Error('error view failed')
  const errorView = createFailingComponent(failure)
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

test('keeps the error visible when navigation is aborted', async () => {
  const route = createRoute({ name: 'home', path: '/[id]' })
  route.onBeforeRouteUpdate((_to, { abort }) => abort())
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const child = createFailingComponent()
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

test('resets only when its own router refreshes', async () => {
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
