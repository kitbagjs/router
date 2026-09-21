import { flushPromises } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import { App, Component, createApp, defineAsyncComponent } from 'vue'
import { createUseRouteValueStore } from '@/compositions/useRouteValueStore'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRouterAssets } from '@/services/createRouterAssets'
import { UseNavigation, UseNavigationProgress } from '@/types/navigation'
import { Router } from '@/types/router'
import { component } from '@/utilities/testHelpers'

type Observed = UseNavigation & UseNavigationProgress & { app: App }

/**
 * Installing the router starts it, so the initial navigation is under way by the time this returns.
 */
function observe(router: Router): Observed {
  const app = createApp({})

  app.use(router)

  const { useNavigation, useNavigationProgress } = createRouterAssets(router)

  return app.runWithContext(() => ({
    ...useNavigation(),
    ...useNavigationProgress(),
    app,
  }))
}

function never(): Promise<never> {
  return new Promise(() => {})
}

describe('navigation progress', () => {
  test('counts the before hooks, props getters, loaders and async components of a nested route', async () => {
    const globalHook = Promise.withResolvers<string>()
    const parentHook = Promise.withResolvers<string>()
    const childHook = Promise.withResolvers<string>()
    const loader = Promise.withResolvers<string>()
    const props = Promise.withResolvers<Record<string, unknown>>()
    const load = Promise.withResolvers<Component>()

    const parent = createRoute({ name: 'parent', path: '/parent' }).addLoader(() => loader.promise)
    const child = createRoute({
      parent,
      name: 'child',
      path: '/child',
      component: defineAsyncComponent(() => load.promise),
    }, () => props.promise)

    parent.onBeforeRouteEnter(async () => {
      await parentHook.promise
    })
    child.onBeforeRouteEnter(async () => {
      await childHook.promise
    })

    const router = createRouter([parent, child], { initialUrl: '/parent/child' })

    router.onBeforeRouteEnter(async () => {
      await globalHook.promise
    })

    const navigation = observe(router)

    expect(navigation.pending.value).toBe(true)
    expect(navigation.total.value).toBe(6)
    expect(navigation.settled.value).toBe(0)
    expect(navigation.to.value?.name).toBe('child')

    globalHook.resolve('ok')
    await flushPromises()

    expect(navigation.settled.value).toBe(1)
    expect(router.started.value).toBe(false)

    parentHook.resolve('ok')
    childHook.resolve('ok')
    await flushPromises()

    expect(navigation.settled.value).toBe(3)
    expect(navigation.progress.value).toBe(0.5)
    expect(router.route.name).toBe('child')
    expect(navigation.pending.value).toBe(true)

    loader.resolve('data')
    props.resolve({})
    await flushPromises()

    expect(navigation.settled.value).toBe(5)
    expect(navigation.pending.value).toBe(true)

    load.resolve(component)
    await flushPromises()

    expect(navigation.settled.value).toBe(6)
    expect(navigation.pending.value).toBe(false)
    expect(navigation.progress.value).toBe(0)
  })

  test('a push from a loader starts a fresh ledger for the navigation it causes', async () => {
    const targetLoader = Promise.withResolvers<string>()
    const source = createRoute({ name: 'source', path: '/source' }).addLoader((_route, { push }) => push('/target'))
    const target = createRoute({ name: 'target', path: '/target' }).addLoader(() => targetLoader.promise)
    const router = createRouter([source, target], { initialUrl: '/source' })

    const navigation = observe(router)

    expect(navigation.to.value?.name).toBe('source')

    await flushPromises()

    expect(navigation.pending.value).toBe(true)
    expect(navigation.to.value?.name).toBe('target')
    expect(navigation.total.value).toBe(1)
    expect(navigation.settled.value).toBe(0)

    targetLoader.resolve('data')
    await flushPromises()

    expect(navigation.pending.value).toBe(false)
    expect(router.route.name).toBe('target')
  })

  test('a navigation begun while one is pending resets the counts to the new one', async () => {
    const firstHook = Promise.withResolvers<string>()
    const home = createRoute({ name: 'home', path: '/', component })
    const first = createRoute({ name: 'first', path: '/first', component })
    const second = createRoute({ name: 'second', path: '/second', component }).addLoader(never)

    first.onBeforeRouteEnter(async () => {
      await firstHook.promise
    })
    second.onBeforeRouteEnter(never)

    const router = createRouter([home, first, second], { initialUrl: '/' })
    const navigation = observe(router)

    await flushPromises()

    router.push('/first')
    router.push('/second')

    expect(navigation.to.value?.name).toBe('second')
    expect(navigation.total.value).toBe(2)

    firstHook.resolve('ok')
    await flushPromises()

    expect(navigation.to.value?.name).toBe('second')
    expect(navigation.settled.value).toBe(0)
    expect(navigation.pending.value).toBe(true)
  })

  test('a rejection from a before hook completes the navigation', async () => {
    const home = createRoute({ name: 'home', path: '/', component })

    home.onBeforeRouteEnter(never)
    home.onBeforeRouteEnter((_to, { reject }) => reject('NotFound'))

    const router = createRouter([home], { initialUrl: '/' })
    const navigation = observe(router)

    await flushPromises()

    expect(navigation.pending.value).toBe(false)
    expect(navigation.total.value).toBe(2)
    expect(navigation.settled.value).toBe(2)
  })

  test('a url that matches no route completes the navigation', async () => {
    const home = createRoute({ name: 'home', path: '/', component })
    const router = createRouter([home], { initialUrl: '/nowhere' })
    const navigation = observe(router)

    expect(navigation.to.value).toBeNull()

    await flushPromises()

    expect(navigation.pending.value).toBe(false)
    expect(navigation.total.value).toBe(0)
  })

  test('an abort from a before hook hides the navigation without completing it', async () => {
    const home = createRoute({ name: 'home', path: '/', component })

    home.onBeforeRouteEnter(never)
    home.onBeforeRouteEnter((_to, { abort }) => abort())

    const router = createRouter([home], { initialUrl: '/' })
    const navigation = observe(router)

    expect(navigation.total.value).toBe(2)

    await flushPromises()

    expect(navigation.pending.value).toBe(false)
    expect(navigation.total.value).toBe(0)
    expect(navigation.settled.value).toBe(0)
  })

  test('after hooks are not counted', async () => {
    const home = createRoute({ name: 'home', path: '/', component })

    home.onAfterRouteEnter(never)

    const router = createRouter([home], { initialUrl: '/' })
    const navigation = observe(router)

    await flushPromises()

    expect(router.route.name).toBe('home')
    expect(navigation.pending.value).toBe(false)
    expect(navigation.total.value).toBe(0)
  })

  test('prefetching is not counted, and a prefetched value still counts when navigated to', async () => {
    const loader = Promise.withResolvers<string>()
    const home = createRoute({ name: 'home', path: '/', component })
    const other = createRoute({ name: 'other', path: '/other', component }).addLoader(() => loader.promise)
    const router = createRouter([home, other], { initialUrl: '/' })
    const navigation = observe(router)

    await flushPromises()

    const store = navigation.app.runWithContext(() => createUseRouteValueStore(router.key)().createDetachedStore())

    store.compute(router.resolve('other'))
    await flushPromises()

    expect(navigation.pending.value).toBe(false)
    expect(navigation.total.value).toBe(0)

    store.stage()
    router.push('/other')
    await flushPromises()

    expect(navigation.pending.value).toBe(true)
    expect(navigation.total.value).toBe(1)

    loader.resolve('data')
    await flushPromises()

    expect(navigation.pending.value).toBe(false)
    expect(navigation.settled.value).toBe(1)
  })

  test('a server rendering router counts nothing', async () => {
    const home = createRoute({ name: 'home', path: '/', component }).addLoader(never)

    home.onBeforeRouteEnter(never)

    const router = createRouter([home], { initialUrl: '/', ssr: true })
    const navigation = observe(router)

    await flushPromises()

    expect(navigation.pending.value).toBe(false)
    expect(navigation.total.value).toBe(0)
    expect(navigation.to.value).toBeNull()
  })

  test('to and from are the routes of the navigation under way, and null once it ends', async () => {
    const hook = Promise.withResolvers<string>()
    const home = createRoute({ name: 'home', path: '/', component })
    const about = createRoute({ name: 'about', path: '/about', component })

    about.onBeforeRouteEnter(async () => {
      await hook.promise
    })

    const router = createRouter([home, about], { initialUrl: '/' })
    const navigation = observe(router)

    expect(navigation.from.value).toBeNull()

    await flushPromises()

    router.push('/about')

    expect(navigation.to.value?.name).toBe('about')
    expect(navigation.from.value?.name).toBe('home')

    hook.resolve('ok')
    await flushPromises()

    expect(navigation.to.value).toBeNull()
    expect(navigation.from.value).toBeNull()
  })

  test('stopping the router ends the navigation under way', async () => {
    const home = createRoute({ name: 'home', path: '/', component })

    home.onBeforeRouteEnter(never)

    const router = createRouter([home], { initialUrl: '/' })
    const navigation = observe(router)

    expect(navigation.pending.value).toBe(true)

    router.stop()

    expect(navigation.pending.value).toBe(false)
  })
})
