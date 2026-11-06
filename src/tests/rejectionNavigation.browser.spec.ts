/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount } from '@vue/test-utils'
import { assert, expect, onTestFinished, test, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createLoader, createRejection, createRoute, createRouter, RouterView, useLoader, useRoute } from '@/main'
import { isRejection, Rejection, RejectionInternal } from '@/types/rejection'
import { Route } from '@/types/route'

// Exercise shared route capabilities without adding new public rejection methods in this refactor.
function rejectionFor(route: Route): Rejection<'Denied'> & RejectionInternal {
  const rejection = createRejection({ type: 'Denied', status: 403 })
  assert(isRejection(rejection))
  rejection.route = route

  return rejection
}

test('a rejection renders its own computations while useRoute and route hooks retain the underlying route', async () => {
  const beforeLeave = vi.fn()
  const afterLeave = vi.fn()
  const loader = createLoader({ load: () => 'rejection data' })
  const view = defineComponent({
    props: { label: { type: String, required: true } },
    setup(props) {
      const route = useRoute()
      const { data } = useLoader(loader)
      return () => h('p', `${route.name}: ${props.label}, ${data.value}`)
    },
  })
  const homeLoader = createLoader({ load: () => 'home data' })
  const home = createRoute({ name: 'home', path: '/' })
    .addLoader(homeLoader)
    .addView({ template: '<p>{{ label }}</p>', props: ['label'] }, { props: () => ({ label: 'Home' }) })
    .onBeforeRouteLeave(beforeLeave)
    .onAfterRouteLeave(afterLeave)
  const rejection = rejectionFor(createRoute({ path: '/' })
    .addLoader(loader)
    .addView(view, { props: async (route) => ({ label: await route.getData() }) }))
  const next = createRoute({ name: 'next', path: '/next' })
    .addLoader(homeLoader)
    .addView({ template: 'Next' })
  const router = createRouter([home, next], { initialUrl: '/', rejections: [rejection] })
  const wrapper = mount(defineComponent({
    setup() {
      const { data } = useLoader(homeLoader)
      return () => [h('aside', data.value), h(RouterView)]
    },
  }), { global: { plugins: [router] } })
  await router.start()
  await flushPromises()

  router.reject('Denied')
  await flushPromises()

  expect(wrapper.find('aside').text()).toBe('home data')
  expect(wrapper.find('p').text()).toBe('home: rejection data, rejection data')
  expect(router.route.name).toBe('home')
  expect(beforeLeave).not.toHaveBeenCalled()
  expect(afterLeave).not.toHaveBeenCalled()

  await router.push('next')
  await flushPromises()

  expect(wrapper.text()).toBe('home dataNext')
  expect(beforeLeave).toHaveBeenCalledOnce()
  expect(afterLeave).toHaveBeenCalledOnce()
})

test.each(['rejection', 'route'] as const)('replacing a rejection with a %s cancels its computations and ignores their late result', async (destination) => {
  const pending = Promise.withResolvers<string>()
  const cancelled = vi.fn()
  const rejection = rejectionFor(createRoute({ path: '/' })
    .addLoader((_to, { signal }) => {
      signal.addEventListener('abort', cancelled)
      return pending.promise
    })
    .addView({ template: '<p>{{ label }}</p>', props: ['label'] }, {
      props: async (route) => ({ label: await route.getData() }),
    }))
  const replacement = createRejection({ type: 'Locked', component: { template: 'Locked' } })
  const home = createRoute({ name: 'home', path: '/' })
  const next = createRoute({ name: 'next', path: '/next' }).addView({ template: 'Next' })
  const router = createRouter([home, next], { initialUrl: '/', rejections: [rejection, replacement] })
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  await router.start()

  router.reject('Denied')
  await flushPromises()
  let expected

  if (destination === 'rejection') {
    router.reject('Locked')
    expected = 'Locked'
  } else {
    await router.push('next')
    expected = 'Next'
  }

  await flushPromises()

  expect(cancelled).toHaveBeenCalledOnce()
  expect(wrapper.text()).toBe(expected)

  pending.resolve('Late data')
  await flushPromises()

  expect(wrapper.text()).toBe(expected)
})

test('a rejection computation reports failures through onError', async () => {
  const error = new Error('rejection loader failed')
  const rejection = rejectionFor(createRoute({ path: '/' }).addLoader(() => {
    throw error
  }))
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([home], { initialUrl: '/', rejections: [rejection] })
  const onError = vi.fn()
  router.onError(onError)
  onTestFinished(router.stop)
  await router.start()

  router.reject('Denied')
  await flushPromises()

  expect(onError).toHaveBeenCalledExactlyOnceWith(error, expect.objectContaining({ source: 'loader', to: null, from: null }))
  expect(router.route.name).toBe('home')
})

test('server rendering and hydration share the rejection navigation values', async () => {
  document.body.innerHTML = ''
  const view = { template: '<p>{{ label }}</p>', props: ['label'] }
  const serverLoad = vi.fn(() => 'Server data')
  const serverRejection = rejectionFor(createRoute({ path: '/' })
    .addLoader(serverLoad)
    .addView(view, { props: async (route) => ({ label: await route.getData() }) }))
  const home = createRoute({ name: 'home', path: '/' })
  const server = createRouter([home], { initialUrl: '/', ssr: true, rejections: [serverRejection] })
  server.onBeforeRouteEnter((_to, { reject }) => reject('Denied'))
  onTestFinished(server.stop)
  const response = await server.render()
  assert(response.kind === 'reject')
  expect(serverLoad).toHaveBeenCalledOnce()
  document.body.innerHTML = response.payload
  onTestFinished(() => {
    document.body.innerHTML = ''
  })

  const clientLoad = vi.fn(() => 'Client data')
  const clientProps = vi.fn(() => ({ label: 'Client props' }))
  const clientRejection = rejectionFor(createRoute({ path: '/' })
    .addLoader(clientLoad)
    .addView(view, { props: clientProps }))
  const client = createRouter([home], { initialUrl: '/', rejections: [clientRejection] })
  const wrapper = mount(RouterView, { global: { plugins: [client] } })
  await client.start()
  await flushPromises()

  expect(wrapper.text()).toBe('Server data')
  expect(clientLoad).not.toHaveBeenCalled()
  expect(clientProps).not.toHaveBeenCalled()
})

test('rejections render nested and named views through the normal matched view path', async () => {
  const layout = createRoute({ path: '/' }).addView({ template: '<main><RouterView /><RouterView name="aside" /></main>' })
  const rejection = rejectionFor(createRoute({ parent: layout, path: '/denied' })
    .addView({ template: '<p>Denied</p>' })
    .addView({ template: '<aside>Help</aside>' }, { name: 'aside' }))
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([home], { initialUrl: '/', rejections: [rejection] })
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  await router.start()

  router.reject('Denied')
  await flushPromises()

  expect(wrapper.find('main').text()).toBe('DeniedHelp')
  expect(router.route.name).toBe('home')
})
