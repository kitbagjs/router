import { afterEach, beforeEach, expect, expectTypeOf, test, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, RouterLink, type RouteLoaders, type WithData } from '@kitbag/router'
import { defineComponent, h, Suspense } from 'vue'
import manifest from './.kitbag/manifest.generated'
import { routes, checkout, profile } from './.kitbag/routes.generated'
import { events, record } from './events'
import { createRouterAssets } from '@kitbag/router'
import App from './App.vue'
import type { getCountries as fetchCountries } from './api'

const { getCountries } = vi.hoisted(() => ({ getCountries: vi.fn() }))
vi.mock('./api', () => ({ getCountries }))

const wrappers: { unmount: () => void }[] = []

test('generated route exports carry the discovered loader types', () => {
  type Data = WithData<typeof checkout>['data']
  expectTypeOf<Data['countries']>().toEqualTypeOf<ReturnType<typeof fetchCountries>>()
  expectTypeOf<Data['manual']>().toEqualTypeOf<Promise<string>>()
  // @ts-expect-error Undeclared loaders are not available on the generated route.
  type Missing = Data['missing']
  expectTypeOf<Missing>().toBeAny()
})

beforeEach(() => {
  events.value = []
  getCountries.mockReset().mockImplementation(async () => {
    record('request started')
    return [{ code: 'US', name: 'United States' }]
  })
})

afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
})

test('discovers a transitive loader for both routes and deduplicates repeated components', () => {
  const entries = manifest[0].routes
  expect(entries.find(entry => entry.route === 'home')?.loaders).toEqual([])
  expect(entries.find(entry => entry.route === 'checkout')?.loaders).toHaveLength(1)
  expect(entries.find(entry => entry.route === 'profile')?.loaders).toHaveLength(1)
  const checkoutLoaders: RouteLoaders = checkout.matches.at(-1)?.loaders ?? {}
  const profileLoaders: RouteLoaders = profile.matches.at(-1)?.loaders ?? {}
  expect(Object.keys(checkoutLoaders)).toHaveLength(2)
  expect(Object.keys(profileLoaders)).toHaveLength(1)
  const discovered = Object.keys(profileLoaders)[0]
  expect(checkoutLoaders[discovered].load).toBe(profileLoaders[discovered].load)
})

test('runs the elevated loader before nested setup and shares its promise across instances', async () => {
  const router = createRouter(routes, { initialUrl: '/checkout' })
  const { RouterView } = createRouterAssets(router)
  const wrapper = mount(defineComponent(() => () => h(Suspense, {}, { default: () => h(RouterView) })), {
    global: { plugins: [router] },
  })
  wrappers.push(wrapper)
  await router.start()
  await flushPromises()
  expect(getCountries).toHaveBeenCalledOnce()
  await vi.waitFor(() => expect(wrapper.findAll('[data-testid="countries"]')).toHaveLength(2))
  expect(wrapper.text()).toContain('A manually registered loader still works.')
  expect(wrapper.text()).toContain('United States')
  expect(events.value[0].message).toBe('request started')
  expect(events.value.filter(event => event.message.includes('setup: awaiting'))).toHaveLength(2)
})

test('intent prefetch starts the nested loader and navigation reuses its result', async () => {
  const router = createRouter(routes, { initialUrl: '/' })
  const wrapper = mount(RouterLink, {
    props: { to: '/checkout' },
    slots: { default: 'Checkout' },
    global: { plugins: [router] },
  })
  wrappers.push(wrapper)
  await router.start()
  await flushPromises()
  expect(getCountries).not.toHaveBeenCalled()
  await wrapper.trigger('mouseover')
  await flushPromises()
  expect(getCountries).toHaveBeenCalledOnce()
  expect(events.value.some(event => event.message.includes('setup:'))).toBe(false)
  await wrapper.trigger('click', { button: 0 })
  await vi.waitFor(() => expect(router.route.name).toBe('checkout'))
  const data = router.route.data as Record<string, Promise<unknown>>
  const key = Object.keys(profile.matches.at(-1)?.loaders ?? {})[0]
  expect(await data[key]).toEqual([{ code: 'US', name: 'United States' }])
  expect(getCountries).toHaveBeenCalledOnce()
})

test('the demo timeline does not restart an in-flight prefetch when it rerenders', async () => {
  const { promise, resolve } = Promise.withResolvers<{ code: string, name: string }[]>()
  getCountries.mockImplementation(() => {
    record('request started')
    return promise
  })
  const router = createRouter(routes, { initialUrl: '/' })
  const wrapper = mount(App, { global: { plugins: [router] } })
  wrappers.push(wrapper)
  await router.start()
  await flushPromises()
  const link = wrapper.get('a[href="/checkout"]')
  await link.trigger('mouseover')
  await flushPromises()
  await link.trigger('focusin')
  expect(getCountries).toHaveBeenCalledOnce()
  await link.trigger('click', { button: 0 })
  resolve([{ code: 'CA', name: 'Canada' }])
  await vi.waitFor(() => expect(wrapper.findAll('[data-testid="countries"]')).toHaveLength(2))
  expect(wrapper.text()).toContain('Canada')
  expect(getCountries).toHaveBeenCalledOnce()
})
