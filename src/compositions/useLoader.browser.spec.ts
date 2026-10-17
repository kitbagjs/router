/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createLoader, createRoute, createRouter, createRouterAssets, LoaderResult, useLoader } from '@/main'

test('imported and route definitions share state through navigation without remounting', async () => {
  const first = Promise.withResolvers<string>()
  const second = Promise.withResolvers<string>()
  const load = vi.fn((route) => {
    return route.params.id === '1' ? first.promise : second.promise
  })
  const loader = createLoader({ load })
  const route = createRoute({ name: 'user', path: '/users/[id]' }).addLoader(loader, { name: 'user' })
  const router = createRouter([route], { initialUrl: '/users/1' })
  await router.start()
  let definition!: LoaderResult<string>
  let attached!: LoaderResult<string>
  const setup = vi.fn(() => {
    definition = useLoader(loader)
    attached = useLoader(router.route.loaders.user)
    return () => h('div', attached.loading.value ? 'loading' : attached.data.value)
  })
  const wrapper = mount(defineComponent({ setup }), { global: { plugins: [router] } })

  expect(wrapper.text()).toBe('loading')
  first.resolve('first')
  await flushPromises()
  await expect(definition).resolves.toBe('first')
  expect(attached.data.value).toBe('first')
  expect(load).toHaveBeenCalledTimes(1)

  await router.push('/users/2')
  expect(attached.loading.value).toBe(true)
  expect(definition.data.value).toBeUndefined()
  const error = new Error('request failed')
  second.reject(error)
  await flushPromises()

  expect(definition.error.value).toBe(error)
  expect(attached.error.value).toBe(error)
  expect(attached.loading.value).toBe(false)
  await expect(attached).rejects.toBe(error)
  expect(setup).toHaveBeenCalledTimes(1)
  expect(load).toHaveBeenCalledTimes(2)
  wrapper.unmount()
})

test('awaiting a loader suspends setup until its data is available', async () => {
  const pending = Promise.withResolvers<string>()
  const loader = createLoader({ load: () => pending.promise })
  const route = createRoute({ name: 'home', path: '/' }).addLoader(loader)
  const router = createRouter([route], { initialUrl: '/' })
  const view = defineComponent({
    async setup() {
      const data = await useLoader(loader)
      return () => h('div', data)
    },
  })
  const asyncWrapper = mount({ components: { View: view }, template: '<Suspense><View /></Suspense>' }, {
    global: { plugins: [router] },
  })
  expect(asyncWrapper.text()).toBe('')
  pending.resolve('ready')
  await flushPromises()
  expect(asyncWrapper.text()).toBe('ready')
  asyncWrapper.unmount()
})

test('route definitions select attachments when a reusable definition is attached twice', async () => {
  const loader = createLoader({ load: () => 42 })
  const route = createRoute({ name: 'home', path: '/' })
    .addLoader(loader, { name: 'first' })
    .addLoader(loader, { name: 'second' })
  const other = createRoute({ name: 'other', path: '/other' })
  const router = createRouter([route, other], { initialUrl: '/' })
  await router.start()
  const assets = createRouterAssets(router)
  let ambiguous!: LoaderResult<number>
  let selected!: LoaderResult<number>
  const wrapper = mount(defineComponent(() => {
    const current = assets.useRoute()
    if (!('first' in current.loaders)) throw new Error('Expected first loader')
    ambiguous = assets.useLoader(loader)
    selected = assets.useLoader(current.loaders.first)
    return () => h('div')
  }), { global: { plugins: [router] } })

  await expect(ambiguous).rejects.toThrow('multiple attachments')
  await expect(selected).resolves.toBe(42)
  await router.push('/other')
  expect(selected.loading.value).toBe(false)
  expect(selected.data.value).toBeUndefined()
  await expect(selected).rejects.toThrow('not attached')
  wrapper.unmount()
})

test('definitions read data from the consuming router even with the same injection key', async () => {
  const loader = createLoader({ load: (route) => String(route.params.id) })
  const route = createRoute({ name: 'user', path: '/[id]' }).addLoader(loader)
  const first = createRouter([route], { initialUrl: '/1' })
  const second = createRouter([route], { initialUrl: '/2' })
  await Promise.all([first.start(), second.start()])
  const assets = createRouterAssets(second)
  let imported!: LoaderResult<string>
  let local!: LoaderResult<string>
  const wrapper = mount(defineComponent(() => {
    imported = assets.useLoader(first.route.loaders.default)
    local = assets.useLoader(second.route.loaders.default)
    return () => h('div')
  }), { global: { plugins: [second] } })

  await expect(imported).resolves.toBe('2')
  await expect(local).resolves.toBe('2')
  await expect(first.route.data).resolves.toBe('1')
  wrapper.unmount()
  first.stop()
})
