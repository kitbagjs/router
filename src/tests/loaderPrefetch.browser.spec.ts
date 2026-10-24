import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { RouterLink } from '@/main'
import { createUseLink } from '@/compositions/useLink'
import { visibilityObserverKey } from '@/compositions/useVisibilityObserver'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { VisibilityObserver } from '@/services/createVisibilityObserver'
import { PrefetchConfig } from '@/types/prefetch'
import { component } from '@/utilities/testHelpers'
import * as warnings from '@/utilities/warn'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loader prefetch configuration', () => {
  test.each<{
    name: string,
    routerPrefetch?: PrefetchConfig,
    routePrefetch?: PrefetchConfig,
    loaderPrefetch?: PrefetchConfig,
    linkPrefetch?: PrefetchConfig,
    calls: number,
  }>([
    { name: 'is disabled by default', calls: 0 },
    { name: 'inherits router strategy', routerPrefetch: 'eager', calls: 1 },
    { name: 'uses the loaders setting', routerPrefetch: { loaders: 'eager' }, calls: 1 },
    { name: 'ignores the props setting', routerPrefetch: { props: 'eager' }, calls: 0 },
    { name: 'ignores the components setting', routerPrefetch: { components: 'eager' }, calls: 0 },
    { name: 'lets a route enable prefetch', routerPrefetch: false, routePrefetch: 'eager', calls: 1 },
    { name: 'lets a route disable prefetch', routerPrefetch: 'eager', routePrefetch: false, calls: 0 },
    { name: 'lets a route enable loaders', routerPrefetch: false, routePrefetch: { loaders: 'eager' }, calls: 1 },
    { name: 'lets a route disable loaders', routerPrefetch: 'eager', routePrefetch: { loaders: false }, calls: 0 },
    { name: 'inherits loaders when a route only configures props', routerPrefetch: { loaders: 'eager' }, routePrefetch: { props: false }, calls: 1 },
    { name: 'lets a loader enable prefetch', routePrefetch: false, loaderPrefetch: 'eager', calls: 1 },
    { name: 'lets a loader disable prefetch', routePrefetch: 'eager', loaderPrefetch: false, calls: 0 },
    { name: 'accepts a loader loaders config', loaderPrefetch: { loaders: 'eager' }, calls: 1 },
    { name: 'ignores a loader props config', loaderPrefetch: { props: 'eager' }, calls: 0 },
    { name: 'lets a loader disable its loaders setting', routePrefetch: 'eager', loaderPrefetch: { loaders: false }, calls: 0 },
    { name: 'inherits the strategy when a loader enables prefetch', routePrefetch: 'eager', loaderPrefetch: true, calls: 1 },
    { name: 'lets a link enable prefetch', loaderPrefetch: false, linkPrefetch: 'eager', calls: 1 },
    { name: 'lets a link disable prefetch', loaderPrefetch: 'eager', linkPrefetch: false, calls: 0 },
    { name: 'lets a link override the loaders setting', loaderPrefetch: false, linkPrefetch: { loaders: 'eager' }, calls: 1 },
    { name: 'does not enable loaders when a link enables props', loaderPrefetch: false, linkPrefetch: { props: 'eager' }, calls: 0 },
    { name: 'does not disable loaders when a link disables props', loaderPrefetch: 'eager', linkPrefetch: { props: false }, calls: 1 },
    { name: 'lets a link disable the loaders setting', loaderPrefetch: 'eager', linkPrefetch: { loaders: false }, calls: 0 },
    { name: 'preserves lazy as the default strategy', loaderPrefetch: true, calls: 0 },
  ])('$name', async ({ routerPrefetch, routePrefetch, loaderPrefetch, linkPrefetch, calls }) => {
    const load = vi.fn(() => 'data')
    const route = createRoute({ name: 'route', path: '/route', prefetch: routePrefetch })
      .addLoader(load, { prefetch: loaderPrefetch })
    const router = createRouter([route], { initialUrl: '/', prefetch: routerPrefetch })

    mount(RouterLink, {
      props: { to: '/route', prefetch: linkPrefetch },
      global: { plugins: [router] },
    })

    await flushPromises()

    expect(load).toHaveBeenCalledTimes(calls)
  })
})

test.each<[PrefetchConfig, number, number]>([
  [{ props: 'eager' }, 1, 0],
  [{ loaders: 'eager' }, 0, 1],
  [{ props: 'eager', loaders: false }, 1, 0],
  [{ props: false, loaders: 'eager' }, 0, 1],
  [{ props: 'eager', loaders: 'eager' }, 1, 1],
  [{ props: false, loaders: false }, 0, 0],
  ['eager', 1, 1],
  [false, 0, 0],
])('prefetch %j runs props %s times and loaders %s times', async (prefetch, propsCalls, loaderCalls) => {
  const props = vi.fn(() => ({}))
  const load = vi.fn(() => 'data')
  const route = createRoute({ name: 'route', path: '/route' })
    .addView(component, { props })
    .addLoader(load)
  const router = createRouter([route], { initialUrl: '/', prefetch })
  mount(RouterLink, {
    props: { to: '/route' },
    global: { plugins: [router] },
  })

  await flushPromises()

  expect(props).toHaveBeenCalledTimes(propsCalls)
  expect(load).toHaveBeenCalledTimes(loaderCalls)
})

test.each(['props', 'loaders'] as const)('%s can prefetch eagerly while the other waits for intent', async (eager) => {
  const props = vi.fn(() => ({}))
  const load = vi.fn(() => 'data')
  const route = createRoute({
    name: 'route',
    path: '/route',
    prefetch: {
      props: eager === 'props' ? 'eager' : 'intent',
      loaders: eager === 'loaders' ? 'eager' : 'intent',
    },
  })
    .addView(component, { props })
    .addLoader(load)
  const router = createRouter([route], { initialUrl: '/' })
  const wrapper = mount(RouterLink, {
    props: { to: '/route' },
    global: { plugins: [router] },
  })

  await flushPromises()

  expect(props).toHaveBeenCalledTimes(eager === 'props' ? 1 : 0)
  expect(load).toHaveBeenCalledTimes(eager === 'loaders' ? 1 : 0)

  await wrapper.trigger('mouseover')
  await flushPromises()

  expect(props).toHaveBeenCalledOnce()
  expect(load).toHaveBeenCalledOnce()
})

test.each(['focusin', 'mouseover'] as const)('intent prefetch runs a loader once on %s', async (event) => {
  const load = vi.fn(() => 'data')
  const route = createRoute({ name: 'route', path: '/route' })
    .addLoader(load, { prefetch: 'intent' })
  const router = createRouter([route], { initialUrl: '/' })
  const wrapper = mount(RouterLink, {
    props: { to: '/route' },
    global: { plugins: [router] },
  })

  await nextTick()

  expect(load).not.toHaveBeenCalled()

  await wrapper.trigger(event)
  await wrapper.trigger(event)

  expect(load).toHaveBeenCalledOnce()
})

test.each(['lazy', true] as const)('a loader with prefetch %s waits until the link is visible', async (prefetch) => {
  const load = vi.fn(() => 'data')
  const route = createRoute({ name: 'route', path: '/route' })
    .addLoader(load, { prefetch })
  const router = createRouter([route], { initialUrl: '/' })
  const visible = ref(false)

  mount({
    template: '<RouterLink to="/route" />',
    provide: {
      [visibilityObserverKey]: {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        isElementVisible: () => visible.value,
      } satisfies VisibilityObserver,
    },
  }, {
    global: { plugins: [router] },
  })

  await nextTick()

  expect(load).not.toHaveBeenCalled()

  visible.value = true
  await nextTick()

  expect(load).toHaveBeenCalledOnce()

  visible.value = false
  await nextTick()
  visible.value = true
  await nextTick()

  expect(load).toHaveBeenCalledOnce()
})

test.each([true, false])('navigation adopts a prefetched loader when already settled is %s', async (settled) => {
  const { promise, resolve } = Promise.withResolvers<string>()
  const load = vi.fn(() => promise)
  const signals: AbortSignal[] = []
  const home = createRoute({ name: 'home', path: '/' })
    .addView(() => h(RouterLink, { to: '/route' }))
  const route = createRoute({ name: 'route', path: '/route' })
    .addView(component)
    .addLoader((_route, { signal }) => {
      signals.push(signal)

      return load()
    }, { prefetch: 'eager' })
  const router = createRouter([home, route], { initialUrl: '/' })

  await router.start()

  const wrapper = mount({ template: '<RouterView />' }, {
    global: { plugins: [router] },
  })

  expect(load).toHaveBeenCalledOnce()

  if (settled) {
    resolve('prefetched')
    await flushPromises()
  }

  await wrapper.find('a').trigger('click')
  await flushPromises()

  expect(router.route.name).toBe('route')
  expect(load).toHaveBeenCalledOnce()
  expect(signals[0].aborted).toBe(false)

  resolve('prefetched')

  await expect(router.route.data).resolves.toBe('prefetched')
})

test('link push options skip prefetching without discarding it', async () => {
  const warn = vi.spyOn(warnings, 'warn').mockImplementation(() => {})
  const load = vi.fn(({ href }: { href: string }) => href)
  const home = createRoute({ name: 'home', path: '/' })
  const route = createRoute({ name: 'route', path: '/route' }).addLoader(load)
  const router = createRouter([home, route], { initialUrl: '/' })
  const useLink = createUseLink(router.key)
  await router.start()

  const wrapper = mount(defineComponent({
    setup: () => {
      const { push } = useLink('route', {}, {
        prefetch: 'eager',
        query: { tab: 'a' },
      })

      return { push }
    },
    render: () => null,
  }), {
    global: { plugins: [router] },
  })

  await flushPromises()
  expect(load).toHaveBeenCalledOnce()

  await wrapper.vm.push({ query: { page: '2' } })

  await expect(router.route.data).resolves.toBe('/route?tab=a&page=2')
  expect(load).toHaveBeenCalledTimes(2)
  expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('cannot be used when query, hash, or state options are passed'))

  await wrapper.vm.push()

  await expect(router.route.data).resolves.toBe('/route?tab=a')
  expect(load).toHaveBeenCalledTimes(2)
})

test('push options warn when intent prefetching is enabled before it runs', async () => {
  const warn = vi.spyOn(warnings, 'warn').mockImplementation(() => {})
  const load = vi.fn(() => 'loaded')
  const home = createRoute({ name: 'home', path: '/' })
  const route = createRoute({ name: 'route', path: '/route' }).addLoader(load)
  const router = createRouter([home, route], { initialUrl: '/' })
  const useLink = createUseLink(router.key)
  await router.start()

  const wrapper = mount(defineComponent({
    setup: () => {
      const { push } = useLink('route', {}, { prefetch: 'intent' })

      return { push }
    },
    render: () => null,
  }), {
    global: { plugins: [router] },
  })

  expect(load).not.toHaveBeenCalled()
  await wrapper.vm.push({ hash: 'details' })

  await expect(router.route.data).resolves.toBe('loaded')
  expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('cannot be used'))
})

test('push options do not warn when prefetching is disabled', async () => {
  const warn = vi.spyOn(warnings, 'warn').mockImplementation(() => {})
  const load = vi.fn(() => 'loaded')
  const home = createRoute({ name: 'home', path: '/' })
  const route = createRoute({ name: 'route', path: '/route' }).addLoader(load)
  const router = createRouter([home, route], { initialUrl: '/' })
  const useLink = createUseLink(router.key)
  await router.start()

  const wrapper = mount(defineComponent({
    setup: () => {
      const { push } = useLink('route', {}, { prefetch: false })

      return { push }
    },
    render: () => null,
  }), {
    global: { plugins: [router] },
  })
  await flushPromises()
  expect(load).not.toHaveBeenCalled()

  await wrapper.vm.push({ query: { page: '2' } })

  await expect(router.route.data).resolves.toBe('loaded')
  expect(load).toHaveBeenCalledOnce()
  expect(warn).not.toHaveBeenCalled()
})

test('changing RouterLink state recomputes prefetched props and loader data', async () => {
  const load = vi.fn((value: string) => value)
  const props = vi.fn((value: string) => ({ value }))
  const home = createRoute({ name: 'home', path: '/' })
  const route = createRoute({
    name: 'route',
    path: '/route',
    state: { filter: JSON },
  })
    .addLoader((route) => load(JSON.stringify(route.state.filter)), { prefetch: 'eager' })
    .addView(component, {
      props: (route) => props(JSON.stringify(route.state.filter)),
      prefetch: 'eager',
    })
  const router = createRouter([home, route], { initialUrl: '/' })
  const state = ref({ filter: { page: 1 } })
  await router.start()

  const wrapper = mount({
    setup: () => () => h(RouterLink, { to: '/route', state: state.value }),
  }, {
    global: { plugins: [router] },
  })
  await flushPromises()

  expect(load).toHaveBeenCalledOnce()
  expect(props).toHaveBeenCalledOnce()

  state.value.filter.page = 2
  await flushPromises()
  expect(load).toHaveBeenLastCalledWith('{"page":2}')
  expect(props).toHaveBeenLastCalledWith('{"page":2}')

  await wrapper.find('a').trigger('click')
  await flushPromises()

  await expect(router.route.data).resolves.toBe('{"page":2}')
  expect(load).toHaveBeenCalledTimes(2)
  expect(props).toHaveBeenCalledTimes(2)
})

test('intent prefetch uses changed state before the config watcher runs', async () => {
  const load = vi.fn((count: number | undefined) => count)
  const route = createRoute({
    name: 'route',
    path: '/route',
    state: { count: Number },
  })
    .addLoader((route) => load(route.state.count), { prefetch: 'intent' })
  const router = createRouter([route], { initialUrl: '/' })
  const state = ref({ count: 1 })
  const wrapper = mount({
    setup: () => () => h(RouterLink, { to: '/route', state: state.value }),
  }, {
    global: { plugins: [router] },
  })
  await flushPromises()
  const element = wrapper.find('a').element
  element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  expect(load).toHaveBeenCalledExactlyOnceWith(1)

  state.value.count = 2
  element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))

  expect(load).toHaveBeenLastCalledWith(2)
  await flushPromises()
  expect(load).toHaveBeenCalledTimes(2)
})

test('useLink state overrides skip prefetching even when unchanged', async () => {
  const warn = vi.spyOn(warnings, 'warn').mockImplementation(() => {})
  const load = vi.fn((count: number | undefined) => count)
  const home = createRoute({ name: 'home', path: '/' })
  const route = createRoute({
    name: 'route',
    path: '/route',
    state: { count: Number },
  })
    .addLoader((route) => load(route.state.count), { prefetch: 'eager' })
  const router = createRouter([home, route], { initialUrl: '/' })
  const useLink = createUseLink(router.key)
  await router.start()

  const wrapper = mount(defineComponent({
    setup: () => {
      const { push } = useLink('route', {}, { state: { count: 1 } })

      return { push }
    },
    render: () => null,
  }), {
    global: { plugins: [router] },
  })
  await flushPromises()
  expect(load).toHaveBeenCalledExactlyOnceWith(1)

  await wrapper.vm.push({ state: { count: 1 } })

  await expect(router.route.data).resolves.toBe(1)
  expect(load).toHaveBeenCalledTimes(2)
  expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('cannot be used when query, hash, or state options are passed'))
})

test('named and unnamed loaders respect their own config and feed prefetched props', async () => {
  const load = vi.fn(() => 'default data')
  const named = vi.fn(() => 'named data')
  const disabled = vi.fn(() => 'not prefetched')
  const props = vi.fn()
  const home = createRoute({ name: 'home', path: '/' })
  const route = createRoute({ name: 'route', path: '/route' })
    .addLoader(load, { prefetch: 'eager' })
    .addLoader(named, { name: 'named', prefetch: 'eager' })
    .addLoader(disabled, { name: 'disabled', prefetch: false })
    .addView(component, {
      props: async (route) => {
        props(await route.data.default, await route.data.named)

        return {}
      },
      prefetch: { props: 'eager' },
    })
  const router = createRouter([home, route], { initialUrl: '/' })

  await router.start()

  const wrapper = mount(RouterLink, {
    props: { to: '/route' },
    global: { plugins: [router] },
  })

  await flushPromises()

  expect(load).toHaveBeenCalledOnce()
  expect(named).toHaveBeenCalledOnce()
  expect(disabled).not.toHaveBeenCalled()
  expect(props).toHaveBeenCalledExactlyOnceWith('default data', 'named data')

  await wrapper.trigger('click')
  await flushPromises()

  const data = router.route.data as Record<string, Promise<unknown>>

  await expect(data.default).resolves.toBe('default data')
  await expect(data.named).resolves.toBe('named data')
  await expect(data.disabled).resolves.toBe('not prefetched')
  expect(load).toHaveBeenCalledOnce()
  expect(named).toHaveBeenCalledOnce()
  expect(disabled).toHaveBeenCalledOnce()
  expect(props).toHaveBeenCalledOnce()
})

test('prefetched props can wait for a loader without enabling its prefetching', async () => {
  const load = vi.fn(() => 'data')
  const props = vi.fn(async (route) => ({ data: await route.data }))
  const home = createRoute({ name: 'home', path: '/' })
  const route = createRoute({ name: 'route', path: '/route' })
    .addLoader(load)
    .addView(component, { props, prefetch: { props: 'eager' } })
  const router = createRouter([home, route], { initialUrl: '/' })

  await router.start()

  const wrapper = mount(RouterLink, {
    props: { to: '/route' },
    global: { plugins: [router] },
  })

  await flushPromises()

  expect(props).toHaveBeenCalledOnce()
  expect(load).not.toHaveBeenCalled()

  await wrapper.trigger('click')
  await flushPromises()

  expect(load).toHaveBeenCalledOnce()
  expect(props).toHaveBeenCalledOnce()
  await expect(props.mock.results[0].value).resolves.toEqual({ data: 'data' })
})

test.each(['eager', 'intent', false] as const)('a prefetched child can wait for a parent loader with prefetch %s', async (prefetch) => {
  const load = vi.fn(() => 'parent data')
  const childStarted = vi.fn()
  const childData = vi.fn()
  const home = createRoute({ name: 'home', path: '/' })
  const parent = createRoute({ name: 'parent', path: '/parent' })
    .addLoader(load, { prefetch })
  const child = createRoute({ parent, name: 'child', path: '/child' })
    .addLoader(async (_route, { parent }) => {
      childStarted()

      const value = await parent.data
      childData(value)

      return `child of ${value}`
    }, { name: 'child', prefetch: 'eager' })
  const router = createRouter([home, child], { initialUrl: '/' })

  await router.start()

  const wrapper = mount(RouterLink, {
    props: { to: '/parent/child' },
    global: { plugins: [router] },
  })

  await flushPromises()

  expect(childStarted).toHaveBeenCalledOnce()
  expect(load).toHaveBeenCalledTimes(prefetch === 'eager' ? 1 : 0)
  expect(childData).toHaveBeenCalledTimes(prefetch === 'eager' ? 1 : 0)

  if (prefetch === 'intent') {
    await wrapper.trigger('mouseover')
    await flushPromises()

    expect(load).toHaveBeenCalledOnce()
    expect(childData).toHaveBeenCalledExactlyOnceWith('parent data')
  }

  await wrapper.trigger('click')
  await flushPromises()

  const data = router.route.data as Record<string, Promise<unknown>>

  await expect(data.child).resolves.toBe('child of parent data')
  expect(load).toHaveBeenCalledOnce()
  expect(childStarted).toHaveBeenCalledOnce()
  expect(childData).toHaveBeenCalledExactlyOnceWith('parent data')
})

test('retargeting or unmounting a link aborts its prefetched loaders', async () => {
  const { promise, resolve } = Promise.withResolvers<string>()
  const signals: AbortSignal[] = []
  const load = vi.fn(() => promise)
  const route = createRoute({ name: 'route', path: '/route/[id]' })
    .addLoader((_route, { signal }) => {
      signals.push(signal)

      return load()
    }, { prefetch: 'eager' })
  const router = createRouter([route], { initialUrl: '/' })
  const wrapper = mount(RouterLink, {
    props: { to: '/route/1' },
    global: { plugins: [router] },
  })

  expect(load).toHaveBeenCalledOnce()
  expect(signals[0].aborted).toBe(false)

  await wrapper.setProps({ to: '/route/2' })

  expect(load).toHaveBeenCalledTimes(2)
  expect(signals[0].aborted).toBe(true)
  expect(signals[1].aborted).toBe(false)

  wrapper.unmount()

  expect(signals[1].aborted).toBe(true)

  resolve('abandoned')
  await flushPromises()
})

test.each(['eager', 'lazy'] as const)('rerendering a link with the same url keeps its %s prefetched loader', async (prefetch) => {
  const signals: AbortSignal[] = []
  const load = vi.fn((_route: unknown, { signal }: { signal: AbortSignal }) => {
    signals.push(signal)

    return 'data'
  })
  const route = createRoute({ name: 'route', path: '/route', query: 'tab=[?tab]' })
    .addLoader(load, { prefetch })
  const router = createRouter([route], { initialUrl: '/' })
  const query = ref({ tab: 'a' })

  mount({
    setup: () => () => h(RouterLink, { to: '/route', query: query.value }),
    provide: {
      [visibilityObserverKey]: {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        isElementVisible: () => true,
      } satisfies VisibilityObserver,
    },
  }, {
    global: { plugins: [router] },
  })

  await nextTick()

  expect(load).toHaveBeenCalledOnce()

  query.value = { tab: 'a' }
  await nextTick()

  expect(load).toHaveBeenCalledOnce()
  expect(signals[0].aborted).toBe(false)
})

test('retargeting a visible link prefetches its lazy loader for the new url', async () => {
  const load = vi.fn(() => 'data')
  const route = createRoute({ name: 'route', path: '/route/[id]' })
    .addLoader(load, { prefetch: 'lazy' })
  const router = createRouter([route], { initialUrl: '/' })
  const to = ref<`/${string}`>('/route/1')

  mount({
    setup: () => () => h(RouterLink, { to: to.value }),
    provide: {
      [visibilityObserverKey]: {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        isElementVisible: () => true,
      } satisfies VisibilityObserver,
    },
  }, {
    global: { plugins: [router] },
  })

  await nextTick()

  expect(load).toHaveBeenCalledOnce()

  to.value = '/route/2'
  await nextTick()

  expect(load).toHaveBeenCalledTimes(2)
})
