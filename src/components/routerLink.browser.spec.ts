import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { h } from 'vue'
import routerLink from '@/components/routerLink.vue'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
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

  await router.initialized

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

  expect(options).toMatchObject({ replace, query: undefined })
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

  await router.initialized

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

  await router.initialized

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

  await router.initialized

  const anchor = wrapper.find('a')
  const element = anchor.element as HTMLAnchorElement

  expect(isExternal.toString()).toBe(element.innerHTML)
})