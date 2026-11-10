/* eslint-disable vue/one-component-per-file */
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { assert, expect, onTestFinished, test, vi } from 'vitest'
import { createRejection, createRoute, createRouter, createRouterAssets, RouterView, useRoute } from '@/main'

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
