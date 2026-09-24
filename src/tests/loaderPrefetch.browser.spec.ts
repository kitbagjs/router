import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { RouterLink } from '@/main'
import { visibilityObserverKey } from '@/compositions/useVisibilityObserver'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { VisibilityObserver } from '@/services/createVisibilityObserver'
import { PrefetchConfig } from '@/types/prefetch'
import { component } from '@/utilities/testHelpers'

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
    { name: 'uses the props setting', routerPrefetch: { props: 'eager' }, calls: 1 },
    { name: 'ignores the components setting', routerPrefetch: { components: 'eager' }, calls: 0 },
    { name: 'lets a route enable prefetch', routerPrefetch: false, routePrefetch: 'eager', calls: 1 },
    { name: 'lets a route disable prefetch', routerPrefetch: 'eager', routePrefetch: false, calls: 0 },
    { name: 'lets a loader enable prefetch', routePrefetch: false, loaderPrefetch: 'eager', calls: 1 },
    { name: 'lets a loader disable prefetch', routePrefetch: 'eager', loaderPrefetch: false, calls: 0 },
    { name: 'accepts a loader props config', loaderPrefetch: { props: 'eager' }, calls: 1 },
    { name: 'inherits the strategy when a loader enables prefetch', routePrefetch: 'eager', loaderPrefetch: true, calls: 1 },
    { name: 'lets a link enable prefetch', loaderPrefetch: false, linkPrefetch: 'eager', calls: 1 },
    { name: 'lets a link disable prefetch', loaderPrefetch: 'eager', linkPrefetch: false, calls: 0 },
    { name: 'lets a link override the props setting', loaderPrefetch: false, linkPrefetch: { props: 'eager' }, calls: 1 },
    { name: 'preserves lazy as the default strategy', loaderPrefetch: true, calls: 0 },
  ])('$name', async ({ routerPrefetch, routePrefetch, loaderPrefetch, linkPrefetch, calls }) => {
    const load = vi.fn(() => 'data')
    const route = createRoute({ name: 'route', path: '/route', prefetch: routePrefetch })
      .addLoader(load, { prefetch: loaderPrefetch })
    const router = createRouter([route], { initialUrl: '/', prefetch: routerPrefetch })

    const wrapper = mount(RouterLink, {
      props: { to: '/route', prefetch: linkPrefetch },
      global: { plugins: [router] },
    })

    await flushPromises()

    expect(load).toHaveBeenCalledTimes(calls)

    wrapper.unmount()
  })
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

  wrapper.unmount()
})

test.each(['lazy', true] as const)('a loader with prefetch %s waits until the link is visible', async (prefetch) => {
  const load = vi.fn(() => 'data')
  const route = createRoute({ name: 'route', path: '/route' })
    .addLoader(load, { prefetch })
  const router = createRouter([route], { initialUrl: '/' })
  const visible = ref(false)

  const wrapper = mount({
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

  wrapper.unmount()
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

  wrapper.unmount()
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

  wrapper.unmount()
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

  wrapper.unmount()
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
