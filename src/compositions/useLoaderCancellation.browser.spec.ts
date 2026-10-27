/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { Component, defineComponent, h, Suspense } from 'vue'
import { createLoader, createRejection, createRoute, createRouter, RouterView, useLoader } from '@/main'

test('waits for replacement data after a loader redirects', async () => {
  const redirect = Promise.withResolvers<void>()
  const loaded = Promise.withResolvers<string>()
  const setup = vi.fn()
  const resumed = vi.fn()
  const error = vi.fn()
  const loader = createLoader({
    load: async (route, { push }) => {
      if (route.params.id === '1') {
        await redirect.promise
        push('/2')
      }

      return loaded.promise
    },
  })
  const view = defineComponent({
    async setup() {
      setup()
      const result = useLoader(loader)
      await result
      resumed()

      return () => h('p', result.loading.value ? 'loading' : String(result.data.value))
    },
  })
  const route = createRoute({ name: 'user', path: '/[id]' }).addLoader(loader)
    .addView(view)
  const router = createRouter([route], { initialUrl: '/1' })
  const wrapper = mount(defineComponent({
    render: () => h(RouterView, null, {
      default: ({ component }: { component: Component | null }) => h(Suspense, null, {
        default: () => {
          return component ? h(component) : null
        },
        fallback: () => h('p', 'waiting'),
      }),
    }),
  }), { global: { plugins: [router], config: { errorHandler: error } } })
  await router.start()
  await flushPromises()

  redirect.resolve()
  await flushPromises()
  expect(router.route.params.id).toBe('2')
  expect(resumed).not.toHaveBeenCalled()

  loaded.resolve('replacement')
  await flushPromises()
  expect(wrapper.text()).toBe('replacement')
  expect(setup).toHaveBeenCalledTimes(1)
  expect(resumed).toHaveBeenCalledTimes(1)
  expect(error).not.toHaveBeenCalled()
  wrapper.unmount()
})

test('shows the rejection view without resuming setup', async () => {
  const rejected = Promise.withResolvers<void>()
  const continued = vi.fn()
  const error = vi.fn()
  const rejection = createRejection({ type: 'Forbidden', component: { render: () => h('p', 'forbidden') } })
  const loader = createLoader({
    context: [rejection],
    load: async (_route, { reject }) => {
      await rejected.promise
      reject('Forbidden')
    },
  })
  const view = defineComponent({
    async setup() {
      await useLoader(loader)
      continued()

      return () => h('p', 'stale')
    },
  })
  const route = createRoute({ name: 'home', path: '/' }).addLoader(loader)
    .addView(view)
  const router = createRouter([route], { initialUrl: '/' })
  const wrapper = mount(defineComponent({
    render: () => h(RouterView, null, {
      default: ({ component }: { component: Component | null }) => h(Suspense, null, {
        default: () => {
          return component ? h(component) : null
        },
        fallback: () => h('p', 'waiting'),
      }),
    }),
  }), { global: { plugins: [router], config: { errorHandler: error } } })
  await router.start()
  await flushPromises()
  rejected.resolve()
  await flushPromises()

  expect(error).not.toHaveBeenCalled()
  expect(wrapper.text()).toBe('forbidden')
  expect(continued).not.toHaveBeenCalled()
  expect(error).not.toHaveBeenCalled()
  wrapper.unmount()
})

test('keeps waiting when replacement navigation is aborted', async () => {
  const redirect = Promise.withResolvers<void>()
  const loader = createLoader({
    load: async (route, { push }) => {
      if (route.params.id === '1') {
        await redirect.promise
        push('/blocked')
      }

      return 'recovered'
    },
  })
  const route = createRoute({ name: 'user', path: '/[id]' }).addLoader(loader)
  route.onBeforeRouteUpdate((to, { abort }) => {
    if (to.params.id === 'blocked') {
      abort()
    }
  })
  const router = createRouter([route], { initialUrl: '/1' })
  await router.start()
  const wrapper = mount(defineComponent({
    setup() {
      const result = useLoader(loader)

      return { getResult: () => result }
    },
    render: () => null,
  }), { global: { plugins: [router] } })
  const result = wrapper.vm.getResult()
  const settled = vi.fn()
  const waiting = Promise.resolve(result)
  waiting.then(settled, settled)
  redirect.resolve()
  await flushPromises()

  expect(router.route.params.id).toBe('1')
  expect(result.loading.value).toBe(true)
  expect(result.data.value).toBeUndefined()
  expect(result.error.value).toBeUndefined()
  expect(settled).not.toHaveBeenCalled()

  await router.push('/2')
  expect((await waiting).data.value).toBe('recovered')
  wrapper.unmount()
})

test('does not resume setup after the component unmounts', async () => {
  const loaded = Promise.withResolvers<string>()
  const continued = vi.fn()
  const loader = createLoader({ load: () => loaded.promise })
  const route = createRoute({ name: 'home', path: '/' }).addLoader(loader)
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()
  const view = defineComponent({
    async setup() {
      await useLoader(loader)
      continued()

      return () => null
    },
  })
  const wrapper = mount(defineComponent({
    render: () => h(Suspense, null, {
      default: () => h(view),
      fallback: () => null,
    }),
  }), { global: { plugins: [router] } })
  await flushPromises()
  wrapper.unmount()
  loaded.resolve('too late')
  await flushPromises()

  expect(continued).not.toHaveBeenCalled()
})
