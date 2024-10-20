import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { defineAsyncComponent, h } from 'vue'
import echo from '@/components/echo'
import routerLink from '@/components/routerLink.vue'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { PrefetchConfig, getPrefetchConfigValue } from '@/types/prefetch'
import { component } from '@/utilities/testHelpers'

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

test.each([
  true,
  false,
])('calls router.push with url and replace %s', async (replace) => {
  const router = createRouter([
    createRoute({
      name: 'routeA',
      path: '/routeA',
      component: { render: () => h(routerLink, { to: resolve => resolve('routeB'), replace }) },
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

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  app.find('a').trigger('click')

  const [, options] = spy.mock.lastCall ?? []

  expect(options).toMatchObject({ replace })
})

test('to prop as string renders and routes correctly', () => {
  const route = createRoute({
    name: 'route',
    path: '/route',
    component,
  })
  const href = new URL('/route', window.location.origin)

  const router = createRouter([route], {
    initialUrl: '/route',
  })

  const spy = vi.spyOn(router, 'push')

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

  anchor.trigger('click')

  const [arg1] = spy.mock.lastCall ?? []

  expect(arg1).toBe('/route')
})

test('when current route matches descendant, parent has "match" class', async () => {
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
    initialUrl: '/parent-route/child-route',
  })

  const wrapper = mount(routerLink, {
    props: {
      to: '/parent-route',
    },
    slots: {
      default: 'parent-route',
    },
    global: {
      plugins: [router],
    },
  })

  await router.start()

  const anchor = wrapper.find('a')
  expect(anchor.classes()).toContain('router-link--match')
  expect(anchor.classes()).not.toContain('router-link--exact-match')
})

test('when current route matches to prop, parent has "match" and "exact-match" classes', async () => {
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
      to: '/parent-route',
    },
    slots: {
      default: 'parent-route',
    },
    global: {
      plugins: [router],
    },
  })

  await router.start()

  const anchor = wrapper.find('a')
  expect(anchor.classes()).toContain('router-link--match')
  expect(anchor.classes()).toContain('router-link--exact-match')
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
  const element = anchor.element as HTMLAnchorElement

  expect(isExternal.toString()).toBe(element.innerHTML)
})

describe('prefetch components', () => {

  test.each<PrefetchConfig | undefined>([
    undefined,
    true,
    false,
    { components: true },
    { components: false },
  ])('prefetch components respects router config when prefetch is %s', async (prefetch) => {
    let loaded = undefined

    const route = createRoute({
      name: 'route',
      path: '/route',
      component: defineAsyncComponent(() => {
        return new Promise(resolve => {
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

    if (value === true || value === undefined) {
      expect(loaded).toBe(true)
    } else {
      expect(loaded).toBeUndefined()
    }
  })

  test.each<PrefetchConfig | undefined>([
    undefined,
    true,
    false,
    { components: true },
    { components: false },
  ])('prefetch components respects route config when prefetch is %s', async (prefetch) => {
    let loaded = undefined

    const route = createRoute({
      name: 'route',
      path: '/route',
      prefetch,
      component: defineAsyncComponent(() => {
        return new Promise(resolve => {
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

    if (value === true || value === undefined) {
      expect(loaded).toBe(true)
    } else {
      expect(loaded).toBeUndefined()
    }
  })

  test.each<PrefetchConfig | undefined>([
    undefined,
    true,
    false,
    { components: true },
    { components: false },
  ])('prefetch components respects link config when prefetch is %s', async (prefetch) => {
    let loaded = undefined

    const route = createRoute({
      name: 'route',
      path: '/route',
      component: defineAsyncComponent(() => {
        return new Promise(resolve => {
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

    if (value === true || value === undefined) {
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
    { props: true },
    { props: false },
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

    if (value) {
      expect(callback).toHaveBeenCalledOnce()
    } else {
      expect(callback).not.toHaveBeenCalled()
    }
  })

  test.each<PrefetchConfig | undefined>([
    undefined,
    true,
    false,
    { props: true },
    { props: false },
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

    if (value) {
      expect(callback).toHaveBeenCalledOnce()
    } else {
      expect(callback).not.toHaveBeenCalled()
    }
  })

  test.each<PrefetchConfig | undefined>([
    undefined,
    true,
    false,
    { props: true },
    { props: false },
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

    if (value) {
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
      component: () => h(routerLink, { to: resolve => resolve('echo') }),
    })

    const route = createRoute({
      name: 'echo',
      path: '/echo',
      component: echo,
      prefetch: { props: true },
      props,
    })

    const router = createRouter([home, route], {
      initialUrl: '/',
    })

    await router.start()

    const root = {
      template: '<RouterView />',
    }

    const app = mount(root, {
      global: {
        plugins: [router],
      },
    })

    expect(props).toHaveBeenCalledOnce()

    await app.find('a').trigger('click')

    await flushPromises()

    expect(router.route.name).toBe('echo')
    expect(props).toHaveBeenCalledOnce()
    expect(app.text()).toBe(value)
  })

  test('parent routes that should not prefetch props are not prefetched', async () => {
    const parentProps = vi.fn()
    const childProps = vi.fn()

    const home = createRoute({
      name: 'home',
      path: '/',
      component: () => h(routerLink, { to: resolve => resolve('child') }),
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
      prefetch: { props: true },
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

})