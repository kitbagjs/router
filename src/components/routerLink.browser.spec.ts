import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { h } from 'vue'
import routerLink from '@/components/routerLink.vue'
import { Route } from '@/types'
import { component, createMaybeRelativeUrl, createRouter } from '@/utilities'

test('renders an anchor tag with the correct href and slot content', () => {
  const path = '/path/:param'
  const param = 'param'
  const content = 'hello world'
  const href = createMaybeRelativeUrl(path.replace(':param', param))

  const route = {
    name: 'parent',
    path,
    component,
  } as const satisfies Route

  const router = createRouter([route], {
    initialUrl: route.path,
  })

  const wrapper = mount(routerLink, {
    props: {
      to: router.routes.parent({ param }),
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
  const routeA = {
    name: 'routeA',
    path: '/routeA',
    component: { render: () => h(routerLink, { to: router.routes.routeB(), replace }) },
  } as const satisfies Route

  const routeB = {
    name: 'routeB',
    path: '/routeB',
    component,
  } as const satisfies Route

  const router = createRouter([routeA, routeB], {
    initialUrl: routeA.path,
  })

  await router.initialized

  const spy = vi.spyOn<any, 'push'>(router, 'push')

  const root = {
    template: '<RouterView />',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  app.find('a').trigger('click')

  const [, arg2] = spy.mock.lastCall ?? []

  expect(arg2).toMatchObject({ replace, query: undefined })
})

test('to prop as string renders and routes correctly', () => {
  const route = {
    name: 'route',
    path: '/route',
    component,
  } as const satisfies Route
  const href = createMaybeRelativeUrl(route.path)

  const router = createRouter([route], {
    initialUrl: route.path,
  })

  const spy = vi.spyOn<any, 'push'>(router, 'push')

  const wrapper = mount(routerLink, {
    props: {
      to: route.path,
    },
    slots: {
      default: route.name,
    },
    global: {
      plugins: [router],
    },
  })

  const anchor = wrapper.find('a')
  const element = anchor.element as HTMLAnchorElement
  expect(element).toBeInstanceOf(HTMLAnchorElement)
  expect(element.href).toBe(href.toString())
  expect(element.innerHTML).toBe(route.name)

  anchor.trigger('click')

  const [arg1] = spy.mock.lastCall ?? []

  expect(arg1).toBe(route.path)
})

test('when current route matches descendant, parent has "match" class', async () => {
  const route = {
    name: 'parent-route',
    path: '/parent-route',
    children: [
      {
        name: 'child-route',
        path: '/child-route',
        component,
      },
    ],
  } as const satisfies Route

  const router = createRouter([route], {
    initialUrl: '/parent-route/child-route',
  })

  const wrapper = mount(routerLink, {
    props: {
      to: route.path,
    },
    slots: {
      default: route.name,
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
  const route = {
    name: 'parent-route',
    path: '/parent-route',
    children: [
      {
        name: 'child-route',
        path: '/child-route',
        component,
      },
    ],
  } as const satisfies Route

  const router = createRouter([route], {
    initialUrl: '/parent-route',
  })

  const wrapper = mount(routerLink, {
    props: {
      to: route.path,
    },
    slots: {
      default: route.name,
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