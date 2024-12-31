import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { defineAsyncComponent, h, nextTick, ref } from 'vue'
import echo from '@/components/echo'
import routerLink from '@/components/routerLink.vue'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { PrefetchConfig, getPrefetchConfigValue } from '@/types/prefetch'
import { component } from '@/utilities/testHelpers'
import { visibilityObserverKey } from '@/compositions/useVisibilityObserver'
import { VisibilityObserver } from '@/services/createVisibilityObserver'
import { Url } from '@/types/url'
import { RouterPushOptions } from '@/types/routerPush'

test('renders an anchor tag with the correct href and slot content', () => {
  const path = '/path/[paramName]'
  const paramValue = 'ABC'
  const content = 'hello world'
  const href = new URL(path.replace('[paramName]', paramValue), window.location.origin)

  const route = createRoute({
    name: 'parent',
    path,
    component,
  })

  const router = createRouter([route], {
    initialUrl: path,
  })

  const wrapper = mount(routerLink, {
    props: {
      to: (resolve) => resolve('parent', { paramName: paramValue }),
    },
    slots: {
      default: content,
    },
    global: {
      plugins: [router],
    },
  })

  const anchor = wrapper.find('a')
  const element = anchor.element as HTMLAnchorElement
  expect(element).toBeInstanceOf(HTMLAnchorElement)
  expect(element.href).toBe(href.toString())
  expect(element.innerHTML).toBe(content)
})

test('calls router.push with url and push options from props', async () => {
  const propOptions: RouterPushOptions = {
    replace: true,
    query: {
      foo: 'bar',
    },
    hash: 'hash',
    state: {
      zoo: 'jar',
    },
  }

  const router = createRouter([
    createRoute({
      name: 'routeA',
      path: '/routeA',
      component: { render: () => h(routerLink, { to: (resolve) => resolve('routeB'), ...propOptions }) },
    }),
    createRoute({
      name: 'routeB',
      path: '/routeB',
      component,
    }),
  ], {
    initialUrl: '/routeA',
  })

  await router.start()

  const spy = vi.spyOn(router, 'push')

  const root = {
    template: '<RouterView />',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  wrapper.find('a').trigger('click')

  const [, pushOptions] = spy.mock.lastCall ?? []

  expect(pushOptions).toMatchObject({
    replace: true,
    query: new URLSearchParams({
      foo: 'bar',
    }),
    hash: 'hash',
    state: {
      zoo: 'jar',
    },
  })
})

test('calls router.push with url and push options from resolve callback', async () => {
  const resolveOptions: RouterPushOptions = {
    query: {
      foo: 'bar',
    },
    hash: 'hash',
    state: {
      zoo: 'jar',
    },
  }

  const router = createRouter([
    createRoute({
      name: 'routeA',
      path: '/routeA',
      component: { render: () => h(routerLink, { to: (resolve) => resolve('routeB', {}, resolveOptions) }) },
    }),
    createRoute({
      name: 'routeB',
      path: '/routeB',
      state: {
        zoo: String,
      },
      component,
    }),
  ], {
    initialUrl: '/routeA',
  })

  await router.start()

  const root = {
    template: '<RouterView />',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  wrapper.find('a').trigger('click')

  await flushPromises()

  expect(router.route.query.toString()).toBe('foo=bar')
  expect(router.route.hash).toBe('#hash')
  expect(router.route.state).toMatchObject({ zoo: 'jar' })
})

test('given push options from both resolve callback and props, combines query and state, overrides hash and replace', async () => {
  const propOptions: RouterPushOptions = {
    query: {
      prop: 'foo',
    },
    hash: 'propHash',
    state: {
      prop: 'jar',
    },
  }

  const resolveOptions: RouterPushOptions = {
    query: {
      resolve: 'foo',
    },
    hash: 'resolveHash',
    state: {
      resolve: 'jar',
    },
  }

  const router = createRouter([
    createRoute({
      name: 'routeA',
      path: '/routeA',
      component: { render: () => h(routerLink, { to: (resolve) => resolve('routeB', {}, resolveOptions), ...propOptions }) },
    }),
    createRoute({
      name: 'routeB',
      path: '/routeB',
      state: {
        prop: String,
        resolve: String,
      },
      component,
    }),
  ], {
    initialUrl: '/routeA',
  })

  await router.start()

  const root = {
    template: '<RouterView />',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  wrapper.find('a').trigger('click')

  await flushPromises()

  expect(router.route.query.toString()).toBe('prop=foo&resolve=foo')
  expect(router.route.hash).toBe('#propHash')
  expect(router.route.state).toMatchObject({
    resolve: 'jar',
    prop: 'jar',
  })
})

test('to prop as Url renders and routes correctly', async () => {
  const route = createRoute({
    name: 'route',
    path: '/route',
    component,
  })
  const href = new URL('/route', window.location.origin)

  const router = createRouter([route], {
    initialUrl: '/route',
  })

  const wrapper = mount(routerLink, {
    props: {
      to: '/route',
    },
    slots: {
      default: 'route',
    },
    global: {
      plugins: [router],
    },
  })

  const anchor = wrapper.find('a')
  const element = anchor.element as HTMLAnchorElement
  expect(element).toBeInstanceOf(HTMLAnchorElement)
  expect(element.href).toBe(href.toString())
  expect(element.innerHTML).toBe('route')

  wrapper.find('a').trigger('click')

  await flushPromises()

  expect(router.route.name).toBe('route')
})

test.each<{ to: Url, match: boolean, exactMatch: boolean }>([
  { to: '/parent-route', match: true, exactMatch: false },
  { to: '/parent-route/child-route', match: true, exactMatch: true },
  { to: '/other-route', match: false, exactMatch: false },
])('isMatch and isExactMatch classes and slot props works as expected', async ({ to, match, exactMatch }) => {
  const parentRoute = createRoute({
    name: 'parent-route',
    path: '/parent-route',
  })

  const childRoute = createRoute({
    parent: parentRoute,
    name: 'child-route',
    path: '/child-route',
    component,
  })

  const otherRoute = createRoute({
    name: 'other',
    path: '/other',
    component,
  })

  const router = createRouter([parentRoute, childRoute, otherRoute], {
    initialUrl: '/parent-route/child-route',
  })

  const wrapper = mount(routerLink, {
    props: {
      to,
    },
    slots: {
      default: '{{ params.isMatch }} {{ params.isExactMatch }}',
    },
    global: {
      plugins: [router],
    },
  })

  await router.start()

  const anchor = wrapper.find('a')

  expect(anchor.text()).toBe(`${match} ${exactMatch}`)

  if (match) {
    expect(anchor.classes()).toContain('router-link--match')
  } else {
    expect(anchor.classes()).not.toContain('router-link--match')
  }

  if (exactMatch) {
    expect(anchor.classes()).toContain('router-link--exact-match')
  } else {
    expect(anchor.classes()).not.toContain('router-link--exact-match')
  }
})

test('isMatch correctly matches parent when sibling has the same url', async () => {
  const parentRoute = createRoute({
    name: 'parent',
    path: '/parent',
  })

  const siblingRoute = createRoute({
    parent: parentRoute,
    name: 'sibling',
    component,
  })

  const childRoute = createRoute({
    parent: parentRoute,
    name: 'child',
    path: '/child',
    component: () => h(routerLink, { to: (resolve) => resolve('parent') }, () => 'parent'),
  })

  const router = createRouter([parentRoute, siblingRoute, childRoute], {
    initialUrl: '/parent/child',
  })

  const root = {
    template: '<RouterView />',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.start()

  const link = wrapper.find('a')

  expect(link.classes()).toContain('router-link--match')
  expect(link.classes()).not.toContain('router-link--exact-match')
})

test.each([
  [true],
  [false],
])('isExternal slot prop works as expected', async (isExternal) => {
  const parentRoute = createRoute({
    name: 'parent-route',
    path: '/parent-route',
  })

  const childRoute = createRoute({
    parent: parentRoute,
    name: 'child-route',
    path: '/child-route',
    component,
  })

  const router = createRouter([parentRoute, childRoute], {
    initialUrl: '/parent-route',
  })

  const wrapper = mount(routerLink, {
    props: {
      to: isExternal ? 'https://vuejs.org/' : '/parent-route',
    },
    slots: {
      default: '{{ params.isExternal }}',
    },
    global: {
      plugins: [router],
    },
  })

  await router.start()

  const anchor = wrapper.find('a')

  expect(anchor.text()).toBe(isExternal.toString())
})

describe('prefetch components', () => {
  test.each<PrefetchConfig | undefined>([
    undefined,
    true,
    false,
    'eager',
    'lazy',
    { components: true },
    { components: false },
    { components: 'eager' },
    { components: 'lazy' },
  ])('prefetch components respects router config when prefetch is %s', async (prefetch) => {
    let loaded = undefined

    const route = createRoute({
      name: 'route',
      path: '/route',
      component: defineAsyncComponent(() => {
        return new Promise((resolve) => {
          loaded = true
          resolve({ default: { template: 'foo' } })
        })
      }),
    })

    const router = createRouter([route], {
      initialUrl: '/',
      prefetch,
    })

    mount(routerLink, {
      props: {
        to: '/route',
      },
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    const value = getPrefetchConfigValue(prefetch, 'components')

    if (value === 'eager') {
      expect(loaded).toBe(true)
    } else {
      expect(loaded).toBeUndefined()
    }
  })

  test.each<PrefetchConfig | undefined>([
    undefined,
    true,
    false,
    'eager',
    'lazy',
    { components: true },
    { components: false },
    { components: 'eager' },
    { components: 'lazy' },
  ])('prefetch components respects route config when prefetch is %s', async (prefetch) => {
    let loaded = undefined

    const route = createRoute({
      name: 'route',
      path: '/route',
      prefetch,
      component: defineAsyncComponent(() => {
        return new Promise((resolve) => {
          loaded = true
          resolve({ default: { template: 'foo' } })
        })
      }),
    })

    const router = createRouter([route], {
      initialUrl: '/',
    })

    mount(routerLink, {
      props: {
        to: '/route',
      },
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    const value = getPrefetchConfigValue(prefetch, 'components')

    if (value === 'eager') {
      expect(loaded).toBe(true)
    } else {
      expect(loaded).toBeUndefined()
    }
  })

  test.each<PrefetchConfig | undefined>([
    undefined,
    true,
    false,
    'eager',
    'lazy',
    { components: true },
    { components: false },
    { components: 'eager' },
    { components: 'lazy' },
  ])('prefetch components respects link config when prefetch is %s', async (prefetch) => {
    let loaded = undefined

    const route = createRoute({
      name: 'route',
      path: '/route',
      component: defineAsyncComponent(() => {
        return new Promise((resolve) => {
          loaded = true
          resolve({ default: { template: 'foo' } })
        })
      }),
    })

    const router = createRouter([route], {
      initialUrl: '/',
    })

    mount(routerLink, {
      props: {
        to: '/route',
        prefetch,
      },
      global: {
        plugins: [router],
      },
    })

    await flushPromises()

    const value = getPrefetchConfigValue(prefetch, 'components')

    if (value === 'eager') {
      expect(loaded).toBe(true)
    } else {
      expect(loaded).toBeUndefined()
    }
  })
})

describe('prefetch props', () => {
  test.each<PrefetchConfig | undefined>([
    undefined,
    true,
    false,
    'eager',
    'lazy',
    { props: true },
    { props: false },
    { props: 'eager' },
    { props: 'lazy' },
  ])('prefetch props respects router config when prefetch is %s', (prefetch) => {
    const callback = vi.fn()

    const route = createRoute({
      name: 'route',
      path: '/route',
      component: echo,
      props: callback,
    })

    const router = createRouter([route], {
      initialUrl: '/',
      prefetch,
    })

    mount(routerLink, {
      props: {
        to: '/route',
      },
      global: {
        plugins: [router],
      },
    })

    const value = getPrefetchConfigValue(prefetch, 'props')

    if (value === 'eager') {
      expect(callback).toHaveBeenCalledOnce()
    } else {
      expect(callback).not.toHaveBeenCalled()
    }
  })

  test.each<PrefetchConfig | undefined>([
    undefined,
    true,
    false,
    'eager',
    'lazy',
    { props: true },
    { props: false },
    { props: 'eager' },
    { props: 'lazy' },
  ])('prefetch props respects route config when prefetch is %s', (prefetch) => {
    const callback = vi.fn()

    const route = createRoute({
      name: 'route',
      path: '/route',
      component: echo,
      prefetch,
      props: callback,
    })

    const router = createRouter([route], {
      initialUrl: '/',
    })

    mount(routerLink, {
      props: {
        to: '/route',
      },
      global: {
        plugins: [router],
      },
    })

    const value = getPrefetchConfigValue(prefetch, 'props')

    if (value === 'eager') {
      expect(callback).toHaveBeenCalledOnce()
    } else {
      expect(callback).not.toHaveBeenCalled()
    }
  })

  test.each<PrefetchConfig | undefined>([
    undefined,
    true,
    false,
    'eager',
    'lazy',
    { props: true },
    { props: false },
    { props: 'eager' },
    { props: 'lazy' },
  ])('prefetch props respects link config when prefetch is %s', (prefetch) => {
    const callback = vi.fn()

    const route = createRoute({
      name: 'route',
      path: '/route',
      component: echo,
      props: callback,
    })

    const router = createRouter([route], {
      initialUrl: '/',
    })

    mount(routerLink, {
      props: {
        to: '/route',
        prefetch,
      },
      global: {
        plugins: [router],
      },
    })

    const value = getPrefetchConfigValue(prefetch, 'props')

    if (value === 'eager') {
      expect(callback).toHaveBeenCalledOnce()
    } else {
      expect(callback).not.toHaveBeenCalled()
    }
  })

  test('prefetch props are passed to route component', async () => {
    const value = 'hello world'

    const props = vi.fn(() => Promise.resolve({
      value,
    }))

    const home = createRoute({
      name: 'home',
      path: '/',
      component: () => h(routerLink, { to: (resolve) => resolve('echo') }),
    })

    const route = createRoute({
      name: 'echo',
      path: '/echo',
      component: echo,
      prefetch: { props: 'eager' },
      props,
    })

    const router = createRouter([home, route], {
      initialUrl: '/',
    })

    await router.start()

    const root = {
      template: '<RouterView />',
    }

    const wrapper = mount(root, {
      global: {
        plugins: [router],
      },
    })

    expect(props).toHaveBeenCalledOnce()

    wrapper.find('a').trigger('click')

    await flushPromises()

    expect(router.route.name).toBe('echo')
    expect(props).toHaveBeenCalledOnce()
    expect(wrapper.text()).toBe(value)
  })

  test('parent routes that should not prefetch props are not prefetched', async () => {
    const parentProps = vi.fn()
    const childProps = vi.fn()

    const home = createRoute({
      name: 'home',
      path: '/',
      component: () => h(routerLink, { to: (resolve) => resolve('child') }),
    })

    const parent = createRoute({
      name: 'parent',
      path: '/parent',
      component: echo,
      prefetch: { props: false },
      props: parentProps,
    })

    const child = createRoute({
      parent,
      name: 'child',
      path: '/child',
      component: echo,
      prefetch: { props: 'eager' },
      props: childProps,
    })

    const router = createRouter([home, child], {
      initialUrl: '/',
    })

    await router.start()

    const root = {
      template: '<RouterView />',
    }

    mount(root, {
      global: {
        plugins: [router],
      },
    })

    expect(childProps).toHaveBeenCalledOnce()
    expect(parentProps).not.toHaveBeenCalledOnce()
  })

  test('props are not prefetched until link is visible when prefetch is lazy', async () => {
    const callback = vi.fn()

    const routeA = createRoute({
      name: 'routeA',
      path: '/routeA',
      component: () => h(routerLink, { to: (resolve) => resolve('routeB') }),
    })

    const routeB = createRoute({
      name: 'routeB',
      path: '/routeB',
      component: echo,
      prefetch: { props: 'lazy' },
      props: callback,
    })

    const router = createRouter([routeA, routeB], {
      initialUrl: '/routeA',
    })

    await router.start()

    const visible = ref(false)

    const root = {
      template: '<RouterView />',
      provide: {
        [visibilityObserverKey]: {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
          isElementVisible: () => visible.value,
        } satisfies VisibilityObserver,
      },
    }

    mount(root, {
      global: {
        plugins: [router],
      },
    })

    expect(callback).not.toHaveBeenCalled()

    visible.value = true

    await nextTick()

    expect(callback).toHaveBeenCalled()
  })

  test('components are not prefetched until link is visible when prefetch is lazy', async () => {
    let loaded = false

    const routeA = createRoute({
      name: 'routeA',
      path: '/routeA',
      component: () => h(routerLink, { to: (resolve) => resolve('routeB') }),
    })

    const routeB = createRoute({
      name: 'routeB',
      path: '/routeB',
      prefetch: { components: 'lazy' },
      component: defineAsyncComponent(() => {
        return new Promise((resolve) => {
          loaded = true
          resolve({ default: { template: 'foo' } })
        })
      }),
    })

    const router = createRouter([routeA, routeB], {
      initialUrl: '/routeA',
    })

    await router.start()

    const visible = ref(false)

    const root = {
      template: '<RouterView />',
      provide: {
        [visibilityObserverKey]: {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
          isElementVisible: () => visible.value,
        } satisfies VisibilityObserver,
      },
    }

    mount(root, {
      global: {
        plugins: [router],
      },
    })

    expect(loaded).toBe(false)

    visible.value = true

    await nextTick()

    expect(loaded).toBe(true)
  })

  test('props are not prefetched until link is focused when prefetch is intent', async () => {
    const callback = vi.fn()

    const routeA = createRoute({
      name: 'routeA',
      path: '/routeA',
      component: () => h(routerLink, { to: (resolve) => resolve('routeB') }),
    })

    const routeB = createRoute({
      name: 'routeB',
      path: '/routeB',
      component: echo,
      prefetch: { props: 'intent' },
      props: callback,
    })

    const router = createRouter([routeA, routeB], {
      initialUrl: '/routeA',
    })

    await router.start()

    const root = {
      template: '<RouterView />',
    }

    const wrapper = mount(root, {
      global: {
        plugins: [router],
      },
    })

    await nextTick()

    expect(callback).not.toHaveBeenCalled()

    const link = wrapper.find('a')

    link.trigger('focusin')

    await nextTick()

    expect(callback).toHaveBeenCalled()
  })

  test('components are not prefetched until link is focused when prefetch is intent', async () => {
    let loaded = false

    const routeA = createRoute({
      name: 'routeA',
      path: '/routeA',
      component: () => h(routerLink, { to: (resolve) => resolve('routeB') }, () => 'routeB'),
    })

    const routeB = createRoute({
      name: 'routeB',
      path: '/routeB',
      prefetch: { components: 'intent' },
      component: defineAsyncComponent(() => {
        return new Promise((resolve) => {
          loaded = true
          resolve({ template: 'bar' })
        })
      }),
    })

    const router = createRouter([routeA, routeB], {
      initialUrl: '/routeA',
    })

    await router.start()

    const root = {
      template: '<RouterView />',
    }

    const wrapper = mount(root, {
      global: {
        plugins: [router],
      },
    })

    await nextTick()

    expect(loaded).toBe(false)

    wrapper.find('a').trigger('focusin')

    await nextTick()

    expect(loaded).toBe(true)
  })
})
