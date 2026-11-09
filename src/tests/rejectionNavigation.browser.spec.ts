import { createSSRApp, defineComponent, h } from 'vue'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { renderToString } from 'vue/server-renderer'
/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount } from '@vue/test-utils'
import { assert, expect, onTestFinished, test, vi } from 'vitest'
import { createRejection, createRoute, createRouter, RouterView, useLoader, useRoute } from '@/main'
import { isResolvedRejection } from '@/types/resolved'
import { warnLoaderFallback } from '@/services/warnLoaderFallback'

vi.mock('@/services/warnLoaderFallback', () => ({ warnLoaderFallback: vi.fn() }))

test('a rejected destination preserves route context and runs a new navigation lifecycle', async () => {
  const leave = vi.fn()
  const enter = vi.fn()
  const deniedView = defineComponent({
    setup() {
      const route = useRoute()
      return () => h('p', `${route.name}: ${route.params.id}, ${route.hash}`)
    },
  })
  const denied = createRejection({ type: 'Denied', component: deniedView })
  const home = createRoute({ name: 'home', path: '/' }).addView({ template: 'Home' })
    .onBeforeRouteLeave(leave)
  const billing = createRoute({ name: 'billing', path: '/billing/[id]', context: [denied] })
    .onBeforeRouteEnter((_to, { reject }) => reject('Denied'))
  const router = createRouter([home, billing], { initialUrl: '/', rejections: [denied] })
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  await router.start()
  router.onAfterRouteEnter(enter)

  await router.push('billing', { id: '42' }, { hash: 'details' })
  await flushPromises()

  expect(wrapper.text()).toBe('billing: 42, #details')
  expect(router.route.href).toBe('/billing/42#details')
  expect(router.route.matches.at(-1)?.id).toBe(billing.id)
  const rejection = enter.mock.calls[0][0]
  assert(isResolvedRejection(rejection))
  expect(rejection.rejection).toBe(denied)
  expect(enter).toHaveBeenCalledExactlyOnceWith(rejection, expect.anything())
  expect(leave).toHaveBeenLastCalledWith(rejection, expect.anything())
})

test('navigating to the same URL replaces a rejection and computes a fresh route', async () => {
  const load = vi.fn(() => 'Billing data')
  const denied = createRejection({ type: 'Denied', component: { template: 'Denied' } })
  const billing = createRoute({ name: 'billing', path: '/billing' })
    .addLoader(load)
    .addView({ template: 'Billing' })
  const router = createRouter([billing], { initialUrl: '/billing', rejections: [denied] })
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  await router.start()

  router.reject('Denied')
  await flushPromises()
  expect(wrapper.text()).toBe('Denied')
  expect(load).toHaveBeenCalledOnce()

  await router.push('/billing')
  await flushPromises()
  expect(wrapper.text()).toBe('Billing')
  expect(load).toHaveBeenCalledTimes(2)
})

test('a rejection can request a preserved loader without automatically rerunning other loaders', async () => {
  const parentLoad = vi.fn(() => 'Session')
  const load = vi.fn((session: string) => `${session} details`)
  const unused = vi.fn()
  const parent = createRoute({ path: '/' }).addLoader(parentLoad, { name: 'session' })
  const home = createRoute({ parent, name: 'home' })
    .addLoader(async (_route, { parent }) => load(await parent.getData('session')), { name: 'details' })
    .addLoader(unused, { name: 'unused' })
  const loader = createResolvedRoute(home).loaders.details
  const view = defineComponent({
    setup() {
      const { data } = useLoader(loader)
      return () => h('p', data.value)
    },
  })
  const denied = createRejection({ type: 'Denied', component: view })
  const router = createRouter([home], { initialUrl: '/', rejections: [denied] })
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  await router.start()

  router.reject('Denied')
  await flushPromises()

  expect(wrapper.text()).toBe('Session details')
  expect(parentLoad).toHaveBeenCalledTimes(2)
  expect(load).toHaveBeenCalledTimes(2)
  expect(unused).toHaveBeenCalledOnce()
  expect(warnLoaderFallback).not.toHaveBeenCalled()
})

test('replacing a rejection keeps the original route context and replaces the rendered view', async () => {
  const denied = createRejection({ type: 'Denied', component: { template: 'Denied' } })
  const locked = createRejection({ type: 'Locked', component: { template: 'Locked' } })
  const home = createRoute({ name: 'home', path: '/[id]' })
  const router = createRouter([home], { initialUrl: '/42', rejections: [denied, locked] })
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  await router.start()

  router.reject('Denied')
  await flushPromises()
  router.reject('Locked')
  await flushPromises()

  expect(wrapper.text()).toBe('Locked')
  expect(router.route.name).toBe('home')
  expect(router.route.params.id).toBe('42')
})

test('hydration adopts a rejection without running the rejected route computations or before hooks', async () => {
  document.body.innerHTML = ''
  onTestFinished(() => {
    document.body.innerHTML = ''
  })
  const denied = createRejection({ type: 'Denied', component: { template: 'Denied' } })
  const load = vi.fn()
  const home = createRoute({ name: 'home', path: '/', context: [denied] }).addLoader(load)
    .onBeforeRouteEnter((_to, { reject }) => reject('Denied'))
  const server = createRouter([home], { initialUrl: '/', ssr: true, rejections: [denied] })
  onTestFinished(server.stop)
  const response = await server.render()
  assert(response.kind === 'reject')
  document.body.innerHTML = response.payload

  const before = vi.fn()
  const client = createRouter([home], { initialUrl: '/', rejections: [denied] })
  client.onBeforeRouteEnter(before)
  const wrapper = mount(RouterView, { global: { plugins: [client] } })
  await client.start()
  await flushPromises()

  expect(wrapper.text()).toBe('Denied')
  expect(client.route.name).toBe('home')
  expect(load).not.toHaveBeenCalled()
  expect(before).not.toHaveBeenCalled()
})

test('a registered loader requested by a rejection view is reused during hydration', async () => {
  document.body.innerHTML = ''
  onTestFinished(() => {
    document.body.innerHTML = ''
  })
  const serverLoad = vi.fn(() => 'Server data')
  const clientLoad = vi.fn(() => 'Client data')
  const view = defineComponent({
    async setup() {
      const route = useRoute()
      const { data } = await useLoader(route.loaders.default)
      return () => h('p', String(data.value))
    },
  })
  const denied = createRejection({ type: 'Denied', component: view })
  const serverRoute = createRoute({ name: 'home', path: '/', context: [denied] })
    .addLoader(serverLoad)
    .onBeforeRouteEnter((_to, { reject }) => reject('Denied'))
  const server = createRouter([serverRoute], { initialUrl: '/', ssr: true })
  const app = createSSRApp(RouterView)
  app.use(server)
  onTestFinished(server.stop)
  expect(await renderToString(app)).toContain('Server data')
  const response = await server.render()
  assert(response.kind === 'reject')
  document.body.innerHTML = response.payload

  const clientRoute = createRoute({ name: 'home', path: '/' }).addLoader(clientLoad)
  const client = createRouter([clientRoute], { initialUrl: '/', rejections: [denied] })
  const wrapper = mount({ template: '<Suspense><RouterView /></Suspense>' }, { global: { plugins: [client] } })
  await client.start()
  await flushPromises()

  expect(wrapper.text()).toBe('Server data')
  expect(serverLoad).toHaveBeenCalledOnce()
  expect(clientLoad).not.toHaveBeenCalled()
})
