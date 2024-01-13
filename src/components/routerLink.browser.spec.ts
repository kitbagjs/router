import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { h } from 'vue'
import routerLink from '@/components/routerLink'
import { Route } from '@/types'
import { component, createRouter } from '@/utilities'

test('renders an anchor tag with the correct href and slot content', () => {
  const path = 'path/:param'
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
      to: () => router.routes.parent({ param }),
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
    component: { render: () => h(routerLink, { to: router.routes.routeB, replace }) },
  } as const satisfies Route

  const routeB = {
    name: 'routeB',
    path: '/routeB',
    component,
  } as const satisfies Route

  const router = createRouter([routeA, routeB], {
    initialUrl: routeA.path,
  })

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

  expect(spy).toHaveBeenLastCalledWith(routeB.path, { replace })
})