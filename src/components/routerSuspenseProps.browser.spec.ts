/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createRoute, createRouter, createRouterAssets, RouterSuspense, RouterView } from '@/main'

test('leaves component event errors to Vue by default', async () => {
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
  const onError = vi.fn()
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(child), error: errorSlot },
    global: { plugins: [router], config: { errorHandler: onError } },
  })

  await wrapper.get('button').trigger('click')
  expect(wrapper.text()).toBe('ready')
  expect(errorSlot).not.toHaveBeenCalled()
  expect(onError.mock.calls[0][0]).toBe(failure)
})

test.each([
  { name: 'matches', accepts: true },
  { name: 'does not match', accepts: false },
])('uses the predicate when a component error $name', async ({ accepts }) => {
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
  const onError = vi.fn()
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const wrapper = mount(RouterSuspense, {
    props: { catch: predicate },
    slots: { default: () => h(child), error: errorSlot },
    global: { plugins: [router], config: { errorHandler: onError } },
  })

  await wrapper.get('button').trigger('click')
  expect(predicate).toHaveBeenCalledExactlyOnceWith(failure)
  expect(wrapper.text()).toBe(accepts ? 'failed' : 'ready')
  expect(onError).toHaveBeenCalledTimes(accepts ? 0 : 1)
})

test.each(['sync', 'async'] as const)('shows errors from %s props getters by default', async (mode) => {
  const failure = new Error('props failed')
  const pending = Promise.withResolvers<Record<string, unknown>>()
  const route = createRoute({ name: 'home', path: '/' })
    .addView({ render: () => h('p', 'ready') }, {
      props: () => {
        if (mode === 'async') {
          return pending.promise
        }

        throw failure
      },
    })
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const predicate = vi.fn(() => false)
  const wrapper = mount(RouterSuspense, {
    props: { catch: predicate },
    slots: { default: () => h(RouterView), error: errorSlot },
    global: { plugins: [router] },
  })

  if (mode === 'async') {
    pending.reject(failure)
  }

  await flushPromises()
  expect(wrapper.text()).toBe('failed')
  expect(errorSlot).toHaveBeenCalledWith({ error: failure })
  expect(predicate).not.toHaveBeenCalled()
})

test('shows props failures after a successful navigation', async () => {
  const failure = new Error('props failed')
  const route = createRoute({ name: 'home', path: '/[id]' })
    .addView({ render: () => h('p', 'ready') }, {
      props: (route) => {
        if (route.params.id === '2') {
          throw failure
        }

        return {}
      },
    })
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(RouterView), error: errorSlot },
    global: { plugins: [router] },
  })

  expect(wrapper.text()).toBe('ready')
  await router.push('/2')
  await flushPromises()
  expect(wrapper.text()).toBe('failed')
  expect(errorSlot).toHaveBeenCalledWith({ error: failure })
})

test('ignores props failures from a replaced navigation', async () => {
  const pending = Promise.withResolvers<Record<string, unknown>>()
  const route = createRoute({ name: 'home', path: '/[id]' })
    .addView({ render: () => h('p', 'ready') }, {
      props: (route) => {
        return route.params.id === '1' ? pending.promise : {}
      },
    })
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(RouterView), error: errorSlot },
    global: { plugins: [router] },
  })

  await router.push('/2')
  pending.reject(new Error('obsolete failure'))
  await flushPromises()
  expect(wrapper.text()).toBe('ready')
  expect(errorSlot).not.toHaveBeenCalled()
})

test('reports props failures to the nearest boundary', async () => {
  const failure = new Error('props failed')
  const route = createRoute({ name: 'home', path: '/' })
    .addView({ render: () => null }, {
      props: () => {
        throw failure
      },
    })
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const outerError = vi.fn(() => h('p', 'outer error'))
  const wrapper = mount(RouterSuspense, {
    slots: {
      default: () => h(RouterSuspense, null, {
        default: () => h(RouterView),
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

test('reloads failed props when the route is refreshed', async () => {
  const props = vi.fn<() => Promise<Record<string, unknown>>>()
    .mockRejectedValueOnce(new Error('props failed'))
    .mockResolvedValue({})
  const route = createRoute({ name: 'home', path: '/' })
    .addView({ render: () => h('p', 'ready') }, { props })
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(RouterView), error: () => h('p', 'failed') },
    global: { plugins: [router] },
  })
  await flushPromises()
  expect(wrapper.text()).toBe('failed')

  router.refresh()
  await flushPromises()
  expect(wrapper.text()).toBe('ready')
  expect(props).toHaveBeenCalledTimes(2)
})

test('reports props failures in an error slot to the parent boundary', async () => {
  const failure = new Error('props failed')
  const route = createRoute({ name: 'home', path: '/' })
    .addView({ render: () => null }, {
      props: () => {
        throw failure
      },
    })
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const outerError = vi.fn(() => h('p', 'outer error'))
  const wrapper = mount(RouterSuspense, {
    slots: {
      default: () => h(RouterSuspense, null, {
        default: () => h(RouterView),
        error: () => h(RouterView),
      }),
      error: outerError,
    },
    global: { plugins: [router] },
  })
  await flushPromises()

  expect(wrapper.text()).toBe('outer error')
  expect(outerError).toHaveBeenCalledWith({ error: failure })
})

test('keeps props failures scoped to their router', async () => {
  const failure = new Error('props failed')
  const route = createRoute({ name: 'home', path: '/' })
    .addView({ render: () => null }, {
      props: () => {
        throw failure
      },
    })
  const first = createRouter([route], { initialUrl: '/', isGlobalRouter: false })
  const second = createRouter([route], { initialUrl: '/', isGlobalRouter: false })
  await Promise.all([first.start(), second.start()])
  const firstAssets = createRouterAssets(first)
  const secondAssets = createRouterAssets(second)
  const errorSlot = vi.fn(() => h('p', 'failed'))
  mount(firstAssets.RouterSuspense, {
    slots: { default: () => h(secondAssets.RouterView), error: errorSlot },
    global: { plugins: [first, second] },
  })
  await flushPromises()

  expect(errorSlot).not.toHaveBeenCalled()
})
