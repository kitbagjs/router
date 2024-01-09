import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { Route } from '@/types'
import { createRouter } from '@/utilities'

test('renders component for initial route', () => {
  const route = {
    name: 'parent',
    path: '/',
    component: { template: 'hello world' },
  } as const satisfies Route

  const router = createRouter([route], {
    initialUrl: route.path,
  })

  const root = {
    template: '<RouterView/>',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(app.html()).toBe(route.component.template)
})

test('renders components for initial route', () => {
  const childRoute = {
    name: 'child',
    path: 'child',
    component: { template: 'Child' },
  } as const satisfies Route

  const parentRoute = {
    name: 'parent',
    path: '',
    component: { template: '<RouterView />' },
    children: [childRoute],
  } as const satisfies Route

  const router = createRouter([parentRoute], {
    initialUrl: childRoute.path,
  })

  const root = {
    template: '<RouterView />',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(app.html()).toBe(childRoute.component.template)
})

test('updates components when route changes', async () => {
  const childA = {
    name: 'childA',
    path: 'childA',
    component: { template: 'ChildA' },
  } as const satisfies Route

  const childB = {
    name: 'childB',
    path: 'childB',
    component: { template: 'ChildB' },
  } as const satisfies Route

  const childC = {
    name: 'childC',
    path: 'childC',
    component: { template: 'ChildC' },
  } as const satisfies Route

  const router = createRouter([childA, childB, childC], {
    initialUrl: childA.path,
  })

  const root = {
    template: '<RouterView />',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(app.html()).toBe(childA.component.template)

  await router.push(childB.path)

  expect(app.html()).toBe(childB.component.template)

  await router.push(childC.path)

  expect(app.html()).toBe(childC.component.template)

  await router.push(childA.path)

  expect(app.html()).toBe(childA.component.template)
})