/* eslint-disable vue/one-component-per-file */
import { Component, createSSRApp, defineComponent, h, onBeforeUnmount } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { flushPromises, mount } from '@vue/test-utils'
import { assert, expect, onTestFinished, test, vi } from 'vitest'
import { createLoader, createRejection, createRoute, createRouter, createRouterAssets, RouterView, useLoader, useRoute } from '@/main'
import { warnLoaderFallback } from '@/services/warnLoaderFallback'

vi.mock('@/services/warnLoaderFallback', () => ({ warnLoaderFallback: vi.fn() }))

test('a rejection owns the destination and preserves the attempted route only as source', async () => {
  const leave = vi.fn()
  const enter = vi.fn()
  const rejected = vi.fn()
  const denied = createRejection({
    name: 'Denied',
    status: 403,
    component: defineComponent({
      setup() {
        const route = useRoute()
        return () => h('p', `${route.name}: ${route.href}`)
      },
    }),
  })
    .setTitle((to) => `Denied: ${to.name}`)
  const home = createRoute({ name: 'home', path: '/' }).addView({ template: 'Home' })
    .onBeforeRouteLeave(leave)
  const billing = createRoute({ name: 'billing', path: '/billing/[id]', context: [denied] })
    .onBeforeRouteEnter(async (_to, { reject }) => {
      await Promise.resolve()
      reject('Denied')
    })
  const router = createRouter([home, billing], { initialUrl: '/' })
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  await router.start()
  router.onAfterRouteEnter(enter)
  router.onRejection(rejected)

  await router.push('billing', { id: '42' }, { query: { page: '2' }, hash: 'details' })
  await flushPromises()

  expect(wrapper.text()).toBe('Denied: /billing/42?page=2#details')
  assert(router.route.kind === 'rejection')
  expect(router.route.name).toBe('Denied')
  expect(router.route.params).toEqual({})
  expect(router.route.matches.map((match) => match.id)).toEqual([denied.id])
  expect(router.route.source).toMatchObject({ kind: 'route', name: 'billing', params: { id: '42' } })
  expect(router.route.query.get('page')).toBe('2')
  expect(router.route.hash).toBe('#details')
  await expect(router.route.getTitle()).resolves.toBe('Denied: Denied')
  expect(enter).toHaveBeenCalledOnce()
  expect(enter.mock.calls[0][0]).toMatchObject({ kind: 'rejection', name: 'Denied' })
  expect(rejected).toHaveBeenCalledOnce()
  expect(leave).toHaveBeenCalledOnce()
})

test('a guard rejection takes over one history entry and a late rejection does not add another', async () => {
  const denied = createRejection({ name: 'Denied' })
  const home = createRoute({ name: 'home', path: '/' })
  const billing = createRoute({ name: 'billing', path: '/billing', context: [denied] })
    .onBeforeRouteEnter((_to, { reject }) => reject('Denied'))
  const router = createRouter([home, billing], { initialUrl: '/', historyMode: 'memory' })
  onTestFinished(router.stop)
  await router.start()

  await router.push('/billing')
  expect(router.route.name).toBe('Denied')
  expect(router.route.href).toBe('/billing')
  await router.reject('Denied')
  router.back()
  await flushPromises()
  expect(router.route.name).toBe('home')
})

test('a rejection cancelled by a leave guard does not change the URL or current route', async () => {
  const denied = createRejection({ name: 'Denied' })
  const home = createRoute({ name: 'home', path: '/' })
    .onBeforeRouteLeave((to, { abort }) => {
      if (to?.kind === 'rejection') {
        abort()
      }
    })
  const billing = createRoute({ name: 'billing', path: '/billing', context: [denied] })
    .onBeforeRouteEnter((_to, { reject }) => reject('Denied'))
  const router = createRouter([home, billing], { initialUrl: '/', historyMode: 'memory' })
  onTestFinished(router.stop)
  await router.start()
  await router.push('/billing')

  expect(router.route.name).toBe('home')
  expect(router.route.href).toBe('/')
  router.refresh()
  await flushPromises()
  expect(router.route.name).toBe('home')
})

test('the rejection runs its own loaders without inheriting the attempted route computations', async () => {
  const originalLoad = vi.fn()
  const originalTitle = vi.fn(() => 'Original')
  const load = vi.fn(() => 'Rejection data')
  const loader = createLoader({ load })
  const denied = createRejection({
    name: 'Denied',
    component: defineComponent({
      setup() {
        const { data } = useLoader(loader)
        return () => h('p', data.value)
      },
    }),
  })
    .addLoader(loader)
  const home = createRoute({ name: 'home', path: '/', context: [denied] })
    .addLoader(originalLoad)
    .setTitle(originalTitle)
    .onBeforeRouteEnter((_to, { reject }) => reject('Denied'))
  const router = createRouter([home], { initialUrl: '/' })
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  await router.start()
  await flushPromises()

  expect(wrapper.text()).toBe('Rejection data')
  expect(load).toHaveBeenCalledOnce()
  expect(originalLoad).not.toHaveBeenCalled()
  expect(originalTitle).not.toHaveBeenCalled()
  await expect(router.route.getTitle()).resolves.toBeUndefined()
  expect(warnLoaderFallback).not.toHaveBeenCalled()
})

test('a persistent consumer outside RouterView follows ordinary and rejection navigation', async () => {
  const load = vi.fn((route) => route.name)
  const loader = createLoader({ load })
  const home = createRoute({ name: 'home', path: '/' }).addLoader(loader)
  const denied = createRejection({ name: 'Denied' }).addLoader(loader)
  const router = createRouter([home], { initialUrl: '/', rejections: [denied] })
  const wrapper = mount(defineComponent({
    setup() {
      const { data } = useLoader(loader)
      return () => h('header', data.value)
    },
  }), { global: { plugins: [router] } })
  await router.start()
  await flushPromises()
  expect(wrapper.text()).toBe('home')

  await router.reject('Denied')
  await flushPromises()
  expect(wrapper.text()).toBe('Denied')
  await router.push('/')
  await flushPromises()
  expect(wrapper.text()).toBe('home')
  expect(load).toHaveBeenCalledTimes(3)
  expect(warnLoaderFallback).not.toHaveBeenCalled()
})

test('replacing a rejection preserves the original source and unmatched URLs have no source', async () => {
  const denied = createRejection({ name: 'Denied' })
  const locked = createRejection({ name: 'Locked' })
  const home = createRoute({ name: 'home', path: '/[id]' })
  const router = createRouter([home], { initialUrl: '/42', rejections: [denied, locked] })
  onTestFinished(router.stop)
  await router.start()
  await router.reject('Denied')
  assert(router.route.kind === 'rejection')
  const source = router.route.source
  await router.reject('Locked')
  expect(router.route.source).toBe(source)
  expect(router.route.name).toBe('Locked')
  expect(router.route.source?.params.id).toBe('42')

  await router.push('/not/a/route')
  expect(router.route.name).toBe('NotFound')
  expect(router.route.source).toBeNull()
  await router.reject('Locked')
  expect(router.route.source).toBeNull()
})

test('query updates and refresh retry the adopted URL', async () => {
  const denied = createRejection({ name: 'Denied' })
  const home = createRoute({ name: 'home', path: '/home' })
  const router = createRouter([home], { initialUrl: '/home', rejections: [denied] })
  onTestFinished(router.stop)
  await router.start()
  await router.reject('Denied')
  router.route.query.set('page', '2')
  await flushPromises()
  expect(router.route.name).toBe('home')
  expect(router.route.href).toBe('/home?page=2')

  await router.reject('Denied')
  await router.route.update({}, { hash: 'details' })
  expect(router.route.name).toBe('home')
  expect(router.route.href).toBe('/home?page=2#details')

  await router.reject('Denied')
  router.refresh()
  await flushPromises()
  expect(router.route.name).toBe('home')
})

test('named useRoute reads the rejection and synchronous initial resolution does not start loaders', async () => {
  const load = vi.fn(() => 'loaded')
  const home = createRoute({ name: 'home', path: '/home' }).addLoader(load)
  const denied = createRejection({ name: 'Denied' })
  const router = createRouter([home], { initialUrl: '/home', rejections: [denied] })
  expect(router.route.name).toBe('home')
  expect(router.started.value).toBe(false)
  expect(load).not.toHaveBeenCalled()
  await router.start()
  await router.reject('Denied')
  const { useRoute } = createRouterAssets(router)
  const wrapper = mount(defineComponent({
    setup() {
      const route = useRoute('Denied')
      return () => h('p', route.name)
    },
  }), { global: { plugins: [router] } })
  expect(wrapper.text()).toBe('Denied')
})

test('SSR hydrates the selected rejection and its own loader values without running original computations', async () => {
  document.body.innerHTML = ''
  onTestFinished(() => {
    document.body.innerHTML = ''
  })
  const originalLoad = vi.fn()
  const serverLoad = vi.fn(() => 'Server data')
  const clientLoad = vi.fn(() => 'Client data')
  const serverLoader = createLoader({ load: serverLoad })
  const clientLoader = createLoader({ load: clientLoad })
  function view(loader: typeof serverLoader): Component {
    return defineComponent({
      async setup() {
        const { data } = await useLoader(loader)
        return () => h('p', data.value)
      },
    })
  }
  const denied = createRejection({
    name: 'Denied',
    status: 403,
    component: view(serverLoader),
  })
    .addLoader(serverLoader)
  const home = createRoute({ name: 'home', path: '/', context: [denied] })
    .addLoader(originalLoad)
    .onBeforeRouteEnter((_to, { reject }) => reject('Denied'))
  const server = createRouter([home], { initialUrl: '/', ssr: true })
  const app = createSSRApp(RouterView)
  app.use(server)
  onTestFinished(server.stop)
  expect(await renderToString(app)).toContain('Server data')
  const response = await server.render()
  assert(response.kind === 'reject')
  expect(response.status).toBe(403)
  document.body.innerHTML = response.payload

  const clientDenied = createRejection({
    name: 'Denied',
    status: 403,
    component: view(clientLoader),
  })
    .addLoader(clientLoader)
  const clientHome = createRoute({ name: 'home', path: '/' }).addLoader(originalLoad)
  const client = createRouter([clientHome], { initialUrl: '/', rejections: [clientDenied] })
  const before = vi.fn()
  client.onBeforeRouteEnter(before)
  const wrapper = mount({ template: '<Suspense><RouterView /></Suspense>' }, { global: { plugins: [client] } })
  await client.start()
  await flushPromises()

  expect(wrapper.text()).toBe('Server data')
  expect(client.route.name).toBe('Denied')
  assert(client.route.kind === 'rejection')
  expect(client.route.source?.name).toBe('home')
  expect(serverLoad).toHaveBeenCalledOnce()
  expect(clientLoad).not.toHaveBeenCalled()
  expect(originalLoad).not.toHaveBeenCalled()
  expect(before).not.toHaveBeenCalled()
})

test.each(['progressive', 'blocking'] as const)('a %s loader rejection keeps one history entry at the attempted URL', async (navigation) => {
  const denied = createRejection({ name: 'Denied' })
  const home = createRoute({ name: 'home', path: '/' })
  const project = createRoute({ name: 'project', path: '/projects/[id]', context: [denied] })
    .addLoader(async (_to, { reject }) => {
      await Promise.resolve()
      reject('Denied')
    })
  const router = createRouter([home, project], { initialUrl: '/', historyMode: 'memory', navigation })
  onTestFinished(router.stop)
  await router.start()

  await router.push('project', { id: '42' })
  await flushPromises()
  expect(router.route.name).toBe('Denied')
  expect(router.route.href).toBe('/projects/42')
  assert(router.route.kind === 'rejection')
  expect(router.route.source?.name).toBe('project')
  router.back()
  await flushPromises()
  expect(router.route.name).toBe('home')
})

test('persistent loaders select rejection data synchronously in global after hooks', async () => {
  const pending = Promise.withResolvers<string>()
  const loader = createLoader({
    load: (to) => {
      return to.kind === 'rejection' ? pending.promise : 'home'
    },
  })
  const home = createRoute({ name: 'home', path: '/' }).addLoader(loader)
  const denied = createRejection({ name: 'Denied' }).addLoader(loader)
  const router = createRouter([home], { initialUrl: '/', rejections: [denied] })
  onTestFinished(router.stop)
  let result: ReturnType<typeof useLoader> | undefined
  const wrapper = mount(defineComponent({
    setup() {
      result = useLoader(loader)
      return () => null
    },
  }), { global: { plugins: [router] } })
  onTestFinished(() => wrapper.unmount())
  await router.start()
  expect(result?.data.value).toBe('home')
  const after = vi.fn((to) => {
    if (to.kind === 'rejection') {
      expect(result?.loading.value).toBe(true)
      expect(result?.data.value).toBeUndefined()
    }
  })
  router.onAfterRouteEnter(after)
  router.onAfterRouteUpdate(after)

  await router.reject('Denied')
  await router.reject('Denied')

  expect(after).toHaveBeenCalledTimes(2)
  pending.resolve('denied')
  await flushPromises()
  expect(result?.data.value).toBe('denied')
  expect(warnLoaderFallback).not.toHaveBeenCalled()
})

test('rejections run enter, update, and leave hooks locally and globally', async () => {
  const local: string[] = []
  const global: string[] = []
  let signedIn = false
  const denied = createRejection({ name: 'Denied' })
    .onBeforeRouteEnter((_to, context) => {
      local.push('before enter')
      expect(context.abort).toBeTypeOf('function')
      expect(context.reject).toBeTypeOf('function')
      expect(context.push).toBeTypeOf('function')
    })
    .onAfterRouteEnter(() => {
      local.push('after enter')
    })
    .onBeforeRouteUpdate(() => {
      local.push('before update')
    })
    .onAfterRouteUpdate(() => {
      local.push('after update')
    })
    .onBeforeRouteLeave(() => {
      local.push('before leave')
    })
    .onAfterRouteLeave(() => {
      local.push('after leave')
    })
  const requested = vi.fn()
  denied.onRejection(requested)
  const page = createRoute({ name: 'page', path: '/page', context: [denied] })
    .onBeforeRouteEnter((_to, { reject }) => {
      if (!signedIn) {
        reject('Denied')
      }
    })
  const router = createRouter([page], { initialUrl: '/page' })
  onTestFinished(router.stop)
  router.onBeforeRouteEnter((to) => {
    if (to.kind === 'rejection') {
      global.push('before enter')
    }
  })
  router.onAfterRouteEnter((to) => {
    if (to.kind === 'rejection') {
      global.push('after enter')
    }
  })
  router.onBeforeRouteUpdate((to) => {
    if (to.kind === 'rejection') {
      global.push('before update')
    }
  })
  router.onAfterRouteUpdate((to) => {
    if (to.kind === 'rejection') {
      global.push('after update')
    }
  })
  router.onBeforeRouteLeave((_to, { from }) => {
    if (from.kind === 'rejection') {
      global.push('before leave')
    }
  })
  router.onAfterRouteLeave((_to, { from }) => {
    if (from.kind === 'rejection') {
      global.push('after leave')
    }
  })

  await router.start()
  expect(local).toEqual(['before enter', 'after enter'])
  expect(global).toEqual(local)
  expect(requested).toHaveBeenLastCalledWith('Denied', expect.objectContaining({ to: expect.objectContaining({ name: 'page' }) }))

  router.route.query.set('reason', 'expired')
  await flushPromises()
  expect(router.route.name).toBe('Denied')
  expect(router.route.query.get('reason')).toBe('expired')
  expect(local).toEqual(['before enter', 'after enter', 'before update', 'after update'])
  expect(global).toEqual(local)
  expect(requested).toHaveBeenCalledTimes(2)

  signedIn = true
  router.refresh()
  await flushPromises()
  expect(router.route.name).toBe('page')
  expect(local).toEqual(['before enter', 'after enter', 'before update', 'after update', 'before leave', 'after leave'])
  expect(global).toEqual(local)
})

test('a rejection before-enter hook can abort while onRejection still reports the attempt', async () => {
  const entered = vi.fn()
  const requested = vi.fn()
  const denied = createRejection({ name: 'Denied' })
    .onBeforeRouteEnter((_to, { abort }) => abort())
    .onAfterRouteEnter(entered)
  denied.onRejection(requested)
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([home], { initialUrl: '/', rejections: [denied] })
  onTestFinished(router.stop)
  await router.start()

  await router.reject('Denied')

  expect(router.route.name).toBe('home')
  expect(requested).toHaveBeenCalledOnce()
  expect(entered).not.toHaveBeenCalled()
})

test('rejection before-enter hooks are awaited and can select another rejection', async () => {
  const ready = Promise.withResolvers<void>()
  const locked = createRejection({ name: 'Locked' })
  const denied = createRejection({ name: 'Denied', context: [locked] })
    .onBeforeRouteEnter(async (_to, { reject }) => {
      await ready.promise
      reject('Locked')
    })
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([home], { initialUrl: '/', rejections: [denied] })
  onTestFinished(router.stop)
  await router.start()

  const navigation = router.reject('Denied')
  await flushPromises()
  expect(router.route.name).toBe('home')
  ready.resolve()
  await navigation

  expect(router.route.name).toBe('Locked')
  assert(router.route.kind === 'rejection')
  expect(router.route.source?.name).toBe('home')
})

test('departing views retain their props and loader data when a rejection replaces the route', async () => {
  const beforeUnmount = vi.fn()
  const load = vi.fn((route) => route.name)
  const loader = createLoader({ load })
  const home = createRoute({ name: 'home', path: '/' })
    .addLoader(loader)
    .addView(defineComponent({
      props: { label: { type: String, required: true } },
      setup(props) {
        const { data } = useLoader(loader)
        onBeforeUnmount(() => beforeUnmount(props.label, data.value))
        return () => h('p', `${props.label}:${data.value}`)
      },
    }), { props: () => ({ label: 'Home props' }) })
  const denied = createRejection({
    name: 'Denied',
    component: { template: '<p>Denied</p>' },
  })
    .addLoader(loader)
  const router = createRouter([home], { initialUrl: '/', rejections: [denied] })
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  await router.start()
  await flushPromises()
  expect(wrapper.text()).toBe('Home props:home')

  await router.reject('Denied')
  await flushPromises()

  expect(wrapper.text()).toBe('Denied')
  expect(beforeUnmount).toHaveBeenCalledExactlyOnceWith('Home props', 'home')
  expect(load).toHaveBeenCalledTimes(2)
  expect(warnLoaderFallback).not.toHaveBeenCalled()
})
