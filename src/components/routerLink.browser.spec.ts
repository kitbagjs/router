import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { h } from 'vue'
import routerLink from '@/components/routerLink.vue'
import { Route } from '@/types'
import { component, createRouter } from '@/utilities'

test('renders an anchor tag with the correct href and slot content', () => {
  const path = '/path/:param'
  const param = 'param'
  const content = 'hello world'
  const href = path.replace(':param', param)

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

  expect(wrapper.html()).toBe(`<a href="${href}">${content}</a>`)
})

test.each([
  true,
  false,
])('calls router.push with url and replace %s', (replace) => {
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
  expect(anchor.html()).toBe(`<a href="${route.path}">${route.name}</a>`)

  anchor.trigger('click')

  const [arg1] = spy.mock.lastCall ?? []

  expect(arg1).toBe(route.path)
})