import { flushPromises, mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
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

test('updates route component when clicked', async () => {
  const routeAContent = 'routeA'
  const routeA = {
    name: 'routeA',
    path: '/routeA',
    component: { render: () => h(routerLink, { to: router.routes.routeB }, routeAContent) },
  } as const satisfies Route

  const routeBContent = 'routeB'
  const routeB = {
    name: 'routeB',
    path: '/routeB',
    component: { template: routeBContent },
  } as const satisfies Route

  const router = createRouter([routeA, routeB], {
    initialUrl: routeA.path,
  })

  const root = {
    template: '<RouterView />',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(app.text()).toBe(routeAContent)

  app.find('a').trigger('click')

  await flushPromises()

  expect(app.text()).toBe(routeBContent)
})