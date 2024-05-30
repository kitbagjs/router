import { mount, flushPromises } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { defineAsyncComponent } from 'vue'
import helloWorld from '@/components/helloWorld'
import { createRouter } from '@/services/createRouter'
import { createRoutes } from '@/services/createRoutes'
import { isRouteWithComponent } from '@/types/routeProps'
import { routes } from '@/utilities/testHelpers'

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

test('updates components when route changes', async () => {
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

test('Renders the genericRejection component when the initialUrl does not match', async () => {
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

  expect(app.text()).toBe('NotFound')
})

test('Renders custom genericRejection component when the initialUrl does not match', async () => {
  const NotFound = { template: 'Custom Not Found' }
  const router = createRouter(routes, {
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

  if (!isRouteWithComponent(router.route.matched)) {
    throw 'Matched route does not have a single component'
  }

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

  expect(app.text()).toBe('NotFound')
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

  expect(app.text()).toBe('NotFound')

  await router.push('/')

  expect(app.text()).toBe('hello world')
})

test('Renders the multiple components when using named route views', async () => {
  const routes = createRoutes([
    {
      name: 'parent',
      path: '/',
      components: {
        default: { template: '_default_' },
        one: { template: '_one_' },
        two: { template: '_two_' },
      },
    },
  ])

  const router = createRouter(routes, {
    initialUrl: '/',
  })

  await router.initialized

  const root = {
    template: `
      <RouterView name="one" />
      <RouterView />
      <RouterView name="two" />
    `,
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(app.text()).toBe('_one__default__two_')
})