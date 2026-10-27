import { flushPromises, mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { h } from 'vue'
import { createRoute, createRouter, createRouterAssets, RouterSuspense, RouterView } from '@/main'

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

test.each(['sync', 'async'] as const)('ignores %s props getter errors when props is false', async (mode) => {
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
  const wrapper = mount(RouterSuspense, {
    props: { props: false, catch: true },
    slots: { default: () => h(RouterView), error: errorSlot },
    global: { plugins: [router] },
  })

  if (mode === 'async') {
    pending.reject(failure)
  }

  await flushPromises()
  expect(wrapper.text()).toBe('')
  expect(errorSlot).not.toHaveBeenCalled()
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

  const navigating = router.push('/2')
  pending.reject(new Error('obsolete failure'))
  await navigating
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
