import { flushPromises, mount } from '@vue/test-utils'
import { Component, createApp, defineAsyncComponent } from 'vue'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createUseLink } from '@/compositions/useLink'
import { RouterPushOptions } from '@/types/routerPush'
import { NavigationBehavior } from '@/types/navigation'
import { payloadToScript } from '@/services/payload'

const wrappers: ReturnType<typeof mount>[] = []

afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers.length = 0
  document.body.innerHTML = ''
})

function mountRouter(router: ReturnType<typeof createRouter>): ReturnType<typeof mount> {
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })
  wrappers.push(wrapper)

  return wrapper
}

describe('route commitment', () => {
  test('progressive navigation commits while assets are loading', async () => {
    const loaded = Promise.withResolvers<string>()
    const home = createRoute({ name: 'home', path: '/' }).addView({ template: '<div>Home</div>' })
    const page = createRoute({ name: 'page', path: '/page' })
      .addView({ template: '<div>Page</div>' })
      .addLoader(() => loaded.promise)
    const router = createRouter([home, page], { initialUrl: '/', historyMode: 'memory' })
    const wrapper = mountRouter(router)
    await router.start()

    await router.push('page')

    expect(router.route.name).toBe('page')
    expect(wrapper.text()).toBe('Page')

    loaded.resolve('data')
    await flushPromises()
  })

  test('blocking navigation renders nested views together after every asset settles', async () => {
    const parentProps = Promise.withResolvers<{ label: string }>()
    const childProps = Promise.withResolvers<{ label: string }>()
    const sidebarProps = Promise.withResolvers<{ label: string }>()
    const loaded = Promise.withResolvers<string>()
    const imported = Promise.withResolvers<Component>()
    const onAfterEnter = vi.fn()
    const home = createRoute({ name: 'home', path: '/' }).addView({ template: '<div>Home</div>' })
    const parent = createRoute({ name: 'parent', path: '/parent', navigation: 'blocking' })
      .addView({
        props: ['label'],
        template: '<div>{{ label }}<RouterView /><RouterView name="sidebar" /></div>',
      }, { props: () => parentProps.promise })
      .addLoader(() => loaded.promise)
    const child = createRoute({ name: 'child', parent, path: '/child' })
      .addView(defineAsyncComponent(() => imported.promise), { props: () => childProps.promise })
      .addView({ props: ['label'], template: '<aside>{{ label }}</aside>' }, {
        name: 'sidebar',
        props: () => sidebarProps.promise,
      })
    const router = createRouter([home, child], { initialUrl: '/', historyMode: 'memory' })
    router.onAfterRouteEnter(onAfterEnter)
    const wrapper = mountRouter(router)
    await router.start()
    onAfterEnter.mockClear()

    const navigation = router.push('child')
    await flushPromises()
    expect(wrapper.text()).toBe('Home')

    parentProps.resolve({ label: 'Parent' })
    childProps.resolve({ label: 'Child' })
    sidebarProps.resolve({ label: 'Sidebar' })
    loaded.resolve('data')
    await flushPromises()

    expect(router.route.name).toBe('home')
    expect(wrapper.text()).toBe('Home')
    expect(onAfterEnter).not.toHaveBeenCalled()

    imported.resolve({ props: ['label'], template: '<div>{{ label }}</div>' })
    await navigation

    expect(router.route.name).toBe('child')
    expect(wrapper.text()).toBe('ParentChildSidebar')
    expect(onAfterEnter).toHaveBeenCalled()
  })

  test.each(['props', 'loaders', 'components'] as const)('waits for pending %s independently', async (asset) => {
    const loaded = Promise.withResolvers<void>()
    const view = { template: '<div>Page</div>' }
    const home = createRoute({ name: 'home', path: '/' })
    const page = createRoute({ name: 'page', path: '/page', navigation: 'blocking' })
      .addView(defineAsyncComponent(async () => {
        if (asset === 'components') {
          await loaded.promise
        }

        return view
      }), {
        props: async () => {
          if (asset === 'props') {
            await loaded.promise
          }

          return {}
        },
      })
      .addLoader(() => {
        return asset === 'loaders' ? loaded.promise : 'ready'
      })
    const router = createRouter([home, page], { initialUrl: '/', historyMode: 'memory' })
    await router.start()

    const navigation = router.push('page')
    await flushPromises()
    expect(router.route.name).toBe('home')

    loaded.resolve()
    await navigation
    expect(router.route.name).toBe('page')
  })

  test('parameter updates keep the current props and data until their replacements are ready', async () => {
    const loaded = Promise.withResolvers<string>()
    const props = vi.fn(async (route) => ({ value: await route.data }))
    const load = vi.fn((route) => {
      return route.params.id === '1' ? 'First' : loaded.promise
    })
    const page = createRoute({ name: 'page', path: '/[id]', navigation: 'blocking' })
      .addLoader(load)
      .addView({ props: ['value'], template: '<div>{{ value }}</div>' }, { props })
    const router = createRouter([page], { initialUrl: '/1', historyMode: 'memory' })
    const wrapper = mountRouter(router)
    await router.start()

    const navigation = router.push('page', { id: '2' })
    await flushPromises()
    expect(router.route.params.id).toBe('1')
    expect(wrapper.text()).toBe('First')
    await expect(router.route.data).resolves.toBe('First')

    loaded.resolve('Second')
    await navigation
    expect(wrapper.text()).toBe('Second')
    expect(load).toHaveBeenCalledTimes(2)
    expect(props).toHaveBeenCalledTimes(2)
  })

  test('a newer navigation abandons a blocked destination even if its loader never settles', async () => {
    const onAfterEnter = vi.fn()
    const home = createRoute({ name: 'home', path: '/' })
    const slow = createRoute({ name: 'slow', path: '/slow', navigation: 'blocking' })
      .addLoader(() => new Promise(() => {}))
    const next = createRoute({ name: 'next', path: '/next' })
    const router = createRouter([home, slow, next], { initialUrl: '/', historyMode: 'memory' })
    router.onAfterRouteEnter(onAfterEnter)
    await router.start()
    onAfterEnter.mockClear()

    const blocked = router.push('slow')
    await flushPromises()
    await router.push('next')
    await blocked

    expect(router.route.name).toBe('next')
    expect(onAfterEnter).toHaveBeenCalledTimes(1)
    expect(onAfterEnter).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'next' }),
      expect.objectContaining({ from: expect.objectContaining({ name: 'home' }) }),
    )
  })

  test('stopping the router releases a blocked navigation', async () => {
    const home = createRoute({ name: 'home', path: '/' })
    const page = createRoute({ name: 'page', path: '/page', navigation: 'blocking' })
      .addLoader(() => new Promise(() => {}))
    const router = createRouter([home, page], { initialUrl: '/', historyMode: 'memory' })
    await router.start()

    const navigation = router.push('page')
    await flushPromises()
    router.stop()
    await navigation

    expect(router.route.name).toBe('home')
  })
})

describe('configuration precedence', () => {
  type Configuration = {
    name: string,
    router?: NavigationBehavior,
    parent?: NavigationBehavior,
    route?: NavigationBehavior,
    navigation?: NavigationBehavior,
    expected: NavigationBehavior,
  }

  test.each<Configuration>([
    { name: 'router default', router: 'blocking', expected: 'blocking' },
    { name: 'parent inheritance', parent: 'blocking', expected: 'blocking' },
    { name: 'route overrides router', router: 'progressive', route: 'blocking', expected: 'blocking' },
    { name: 'child overrides parent', parent: 'blocking', route: 'progressive', expected: 'progressive' },
    { name: 'navigation overrides route', route: 'blocking', navigation: 'progressive', expected: 'progressive' },
    { name: 'navigation enables blocking', route: 'progressive', navigation: 'blocking', expected: 'blocking' },
  ])('$name', async (configuration) => {
    const loaded = Promise.withResolvers<void>()
    const home = createRoute({ name: 'home', path: '/' })
    const parent = createRoute({ path: '/parent', navigation: configuration.parent })
    const page = createRoute({ name: 'page', parent, path: '/page', navigation: configuration.route })
      .addLoader(() => loaded.promise)
    const router = createRouter([home, page], {
      initialUrl: '/',
      historyMode: 'memory',
      navigation: configuration.router,
    })
    await router.start()

    const navigation = router.push('page', {}, { navigation: configuration.navigation })
    await flushPromises()

    expect(router.route.name).toBe(configuration.expected === 'blocking' ? 'home' : 'page')

    loaded.resolve()
    await navigation
    expect(router.route.name).toBe('page')
  })

  test.each(['url', 'resolved', 'replace'] as const)('%s navigation preserves its override', async (source) => {
    const loaded = Promise.withResolvers<void>()
    const home = createRoute({ name: 'home', path: '/' })
    const page = createRoute({ name: 'page', path: '/page' }).addLoader(() => loaded.promise)
    const router = createRouter([home, page], { initialUrl: '/', historyMode: 'memory' })
    await router.start()
    const options: RouterPushOptions = { navigation: 'blocking' }
    const navigate = {
      url: () => router.push('/page', options),
      resolved: () => router.push(router.resolve('page'), options),
      replace: () => router.replace('page', {}, options),
    }
    const navigation = navigate[source]()
    await flushPromises()

    expect(router.route.name).toBe('home')
    loaded.resolve()
    await navigation
    expect(router.route.name).toBe('page')
  })
})

describe('links', () => {
  test('a blocking link waits for prefetched work without loading it again', async () => {
    const loaded = Promise.withResolvers<void>()
    const load = vi.fn(() => loaded.promise)
    const home = createRoute({ name: 'home', path: '/' }).addView({
      template: '<RouterLink to="/page" navigation="blocking" prefetch="eager">Page</RouterLink>',
    })
    const page = createRoute({ name: 'page', path: '/page' }).addLoader(load)
    const router = createRouter([home, page], { initialUrl: '/', historyMode: 'memory' })
    const wrapper = mountRouter(router)
    await router.start()
    await flushPromises()
    expect(load).toHaveBeenCalledTimes(1)
    expect(wrapper.find('a').attributes('navigation')).toBeUndefined()

    await wrapper.find('a').trigger('click')
    await flushPromises()
    expect(router.route.name).toBe('home')

    loaded.resolve()
    await flushPromises()
    expect(router.route.name).toBe('page')
    expect(load).toHaveBeenCalledTimes(1)
  })

  test('useLink push options override its configured navigation behavior', async () => {
    const loaded = Promise.withResolvers<void>()
    const home = createRoute({ name: 'home', path: '/' })
    const page = createRoute({ name: 'page', path: '/page' }).addLoader(() => loaded.promise)
    const router = createRouter([home, page], { initialUrl: '/', historyMode: 'memory' })
    const app = createApp({})
    app.use(router)
    await router.start()
    const link = app.runWithContext(() => createUseLink(router.key)('/page', { navigation: 'blocking' }))

    await link.push({ navigation: 'progressive' })
    expect(router.route.name).toBe('page')

    loaded.resolve()
    await flushPromises()
  })
})

describe('initial navigation', () => {
  test('server rendering can wait for blocking initial navigation', async () => {
    const loaded = Promise.withResolvers<string>()
    const page = createRoute({ name: 'page', path: '/' }).addLoader(() => loaded.promise)
    const router = createRouter([page], { initialUrl: '/', ssr: true, navigation: 'blocking' })
    const rendering = router.render()
    await flushPromises()
    expect(router.started.value).toBe(false)

    loaded.resolve('server data')
    const response = await rendering
    expect(response.status).toBe(200)
    expect(router.route.name).toBe('page')
    await expect(router.route.data).resolves.toBe('server data')
  })

  test('hydration still adopts the server result synchronously with blocking configured', async () => {
    document.body.innerHTML = payloadToScript({ kind: 'success', url: '/', values: [] })
    const page = createRoute({ name: 'page', path: '/' })
    const router = createRouter([page], { initialUrl: '/', navigation: 'blocking' })

    const started = router.start()
    expect(router.started.value).toBe(true)
    expect(router.route.name).toBe('page')
    await started
  })
})
