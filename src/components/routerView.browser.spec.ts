import { mount, flushPromises } from '@vue/test-utils'
import { expect, it, test } from 'vitest'
import { defineAsyncComponent } from 'vue'
import helloWorld from '@/components/helloWorld'
import { notFoundText } from '@/components/notFound'
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
    path: '/child',
    component: { template: 'Child' },
  } as const satisfies Route

  const parentRoute = {
    name: 'parent',
    path: '/parent',
    children: [childRoute],
  } as const satisfies Route

  const router = createRouter([parentRoute], {
    initialUrl: '/parent/child',
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
    path: '/childA',
    component: { template: 'ChildA' },
  } as const satisfies Route

  const childB = {
    name: 'childB',
    path: '/childB',
    component: { template: 'ChildB' },
  } as const satisfies Route

  const childC = {
    name: 'childC',
    path: '/childC',
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

it.each([
  defineAsyncComponent(() => import('./helloWorld')),
  () => import('./helloWorld'),
])('resolves async components', async (component) => {
  const route = {
    name: 'parent',
    path: '/',
    component,
  } as const satisfies Route

  const router = createRouter([route], {
    initialUrl: route.path,
  })

  const root = {
    template: '<suspense><RouterView/></suspense>',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await flushPromises()

  expect(app.html()).toBe(helloWorld.template)
})

it('Renders the NotFound component when the initialUrl does not match', () => {
  const route = {
    name: 'parent',
    path: '/',
    component: { template: 'hello world' },
  } as const satisfies Route

  const router = createRouter([route], {
    initialUrl: '/does-not-exist',
  })

  const root = {
    template: '<RouterView/>',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(app.text()).toBe(notFoundText)
})

it('Renders the NotFound component when the router.push does not match', async () => {
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

  router.push('/does-not-exist')

  await flushPromises()

  expect(app.text()).toBe(notFoundText)
})

it('Renders the route component when the router.push does match after a rejection', async () => {
  const route = {
    name: 'parent',
    path: '/',
    component: { template: 'hello world' },
  } as const satisfies Route

  const router = createRouter([route], {
    initialUrl: '/does-not-exist',
  })

  const root = {
    template: '<RouterView/>',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(app.text()).toBe(notFoundText)

  router.push(route.path)

  await flushPromises()

  expect(app.text()).toBe(route.component.template)
})