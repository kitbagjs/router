import { mount, flushPromises } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { defineAsyncComponent } from 'vue'
import helloWorld from '@/components/helloWorld'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { isWithComponent } from '@/types/createRouteOptions'
import { routes } from '@/utilities/testHelpers'

test('renders component for initial route', async () => {
  const route = createRoute({
    name: 'foo',
    path: '/',
    component: { template: 'hello world' },
  })

  const router = createRouter([route], {
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
  const parentRoute = createRoute({
    name: 'parent',
    path: '/parent',
  })

  const childRoute = createRoute({
    parent: parentRoute,
    name: 'child',
    path: '/child',
    component: { template: 'Child' },
  })

  const router = createRouter([parentRoute, childRoute], {
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
  const routes = [
    createRoute({
      name: 'foo',
      path: '/foo',
      component: { template: 'Foo' },
    }),
    createRoute({
      name: 'bar',
      path: '/bar',
      component: { template: 'Bar' },
    }),
    createRoute({
      name: 'zoo',
      path: '/zoo',
      component: { template: 'Zoo' },
    }),
  ]

  const router = createRouter(routes, {
    initialUrl: '/foo',
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

  expect(app.html()).toBe('Foo')

  await router.push('/bar')

  expect(app.html()).toBe('Bar')

  await router.push('/zoo')

  expect(app.html()).toBe('Zoo')

  await router.push('/foo')

  expect(app.html()).toBe('Foo')
})

test.each([
  defineAsyncComponent(() => import('./helloWorld')),
  () => import('./helloWorld'),
])('resolves async components', async (component) => {
  const route = createRoute({
    name: 'async',
    path: '/',
    component,
  })

  const router = createRouter([route], {
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

  if (!isWithComponent(router.route.matched)) {
    throw 'Matched route does not have a single component'
  }

  const route = mount(router.route.matched.component)

  expect(app.text()).toBe(NotFound.template)
  expect(route.text()).toBe(NotFound.template)
})

test('Renders the NotFound component when the router.push does not match', async () => {
  const route = createRoute({
    name: 'foo',
    path: '/',
    component: { template: 'hello world' },
  })

  const router = createRouter([route], {
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
  const route = createRoute({
    name: 'foo',
    path: '/',
    component: { template: 'hello world' },
  })

  const router = createRouter([route], {
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
  const route = createRoute({
    name: 'foo',
    path: '/',
    components: {
      default: { template: '_default_' },
      one: { template: '_one_' },
      two: { template: '_two_' },
    },
  })

  const router = createRouter([route], {
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