import { mount, flushPromises } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { defineAsyncComponent } from 'vue'
import helloWorld from '@/components/helloWorld'
import { notFoundText } from '@/components/notFound'
import { createRouter, createRoutes } from '@/utilities'

test('renders component for initial route', async () => {
  const routes = createRoutes([
    {
      name: 'parent',
      path: '/',
      component: { template: 'hello world' },
    },
  ])

  const router = createRouter(routes, {
    initialUrl: '/',
  })

  await router.initialized

  const root = {
    template: '<RouterView/>',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(app.html()).toBe('hello world')
})

test('renders components for initial route', async () => {
  const routes = createRoutes([
    {
      name: 'parent',
      path: '/parent',
      children: createRoutes([
        {
          name: 'child',
          path: '/child',
          component: { template: 'Child' },
        },
      ]),
    },
  ])

  const router = createRouter(routes, {
    initialUrl: '/parent/child',
  })

  await router.initialized

  const root = {
    template: '<RouterView />',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(app.html()).toBe('Child')
})

test.only('updates components when route changes', async () => {
  const routes = createRoutes([
    {
      name: 'childA',
      path: '/childA',
      component: { template: 'ChildA' },
    }, {
      name: 'childB',
      path: '/childB',
      component: { template: 'ChildB' },
    }, {
      name: 'childC',
      path: '/childC',
      component: { template: 'ChildC' },
    },
  ])

  const router = createRouter(routes, {
    initialUrl: '/childA',
  })

  const root = {
    template: '<RouterView />',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.initialized

  expect(app.html()).toBe('ChildA')

  await router.push('/childB')

  expect(app.html()).toBe('ChildB')

  await router.push('/childC')

  expect(app.html()).toBe('ChildC')

  await router.push('/childA')

  expect(app.html()).toBe('ChildA')
})

test.each([
  defineAsyncComponent(() => import('./helloWorld')),
  () => import('./helloWorld'),
])('resolves async components', async (component) => {
  const routes = createRoutes([
    {
      name: 'parent',
      path: '/',
      component,
    },
  ])

  const router = createRouter(routes, {
    initialUrl: '/',
  })

  const root = {
    template: '<suspense><RouterView/></suspense>',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.initialized
  await flushPromises()

  expect(app.html()).toBe(helloWorld.template)
})

test('Renders the NotFound component when the initialUrl does not match', async () => {
  const router = createRouter([], {
    initialUrl: '/does-not-exist',
  })

  await router.initialized

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

test('Renders custom NotFound component when the initialUrl does not match', async () => {
  const NotFound = { template: 'Custom Not Found' }
  const router = createRouter([], {
    initialUrl: '/does-not-exist',
    rejections: {
      NotFound,
    },
  })

  await router.initialized

  const root = {
    template: '<RouterView/>',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  const route = mount(router.route.matched.component)

  expect(app.text()).toBe(NotFound.template)
  expect(route.text()).toBe(NotFound.template)
})

test('Renders the NotFound component when the router.push does not match', async () => {
  const routes = createRoutes([
    {
      name: 'parent',
      path: '/',
      component: { template: 'hello world' },
    },
  ])

  const router = createRouter(routes, {
    initialUrl: '/',
  })

  await router.initialized

  const root = {
    template: '<RouterView/>',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.push('/does-not-exist')

  expect(app.text()).toBe(notFoundText)
})

test('Renders the route component when the router.push does match after a rejection', async () => {
  const routes = createRoutes([
    {
      name: 'parent',
      path: '/',
      component: { template: 'hello world' },
    },
  ])

  const router = createRouter(routes, {
    initialUrl: '/does-not-exist',
  })

  await router.initialized

  const root = {
    template: '<RouterView/>',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(app.text()).toBe(notFoundText)

  await router.push('/')

  expect(app.text()).toBe('hello world')
})