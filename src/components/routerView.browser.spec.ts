import { mount, flushPromises } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { defineAsyncComponent } from 'vue'
import echo from '@/components/echo'
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
  ] as const

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

test('resolves async components', async () => {
  const route = createRoute({
    name: 'async',
    path: '/',
    component: defineAsyncComponent(() => import('./helloWorld')),
  })

  const router = createRouter([route], {
    initialUrl: '/',
  })

  const root = {
    template: '<RouterView/>',
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

test('Binds props and attrs from route', async () => {

  const routeA = createRoute({
    name: 'routeA',
    path: '/routeA/[param]',
    component: echo,
    props: ({ param }) => ({ value: param }),
  })

  const routeB = createRoute({
    name: 'routeB',
    path: '/routeB/[param]',
    component: echo,
    props: async ({ param }) => {
      return await { value: param }
    },
  })

  const router = createRouter([routeA, routeB], {
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

  await router.push('/routeA/hello')

  expect(app.html()).toBe('hello')

  await router.push('/routeB/world')

  expect(app.html()).toBe('world')
})

test('Updates props and attrs when route params change', async () => {

  const syncProps = createRoute({
    name: 'sync',
    path: '/sync/[param]',
    component: echo,
    props: ({ param }) => ({ value: param }),
  })


  const asyncProps = createRoute({
    name: 'async',
    path: '/async/[param]',
    component: echo,
    props: async ({ param }) => {
      return await { value: param }
    },
  })

  const router = createRouter([syncProps, asyncProps], {
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

  await router.push('sync', { param: 'foo' })

  expect(app.html()).toBe('foo')

  await router.push('sync', { param: 'bar' })

  expect(app.html()).toBe('bar')

  await router.push('async', { param: 'async-foo' })

  await flushPromises()

  expect(app.html()).toBe('async-foo')

  await router.push('async', { param: 'async-bar' })

  await flushPromises()

  expect(app.html()).toBe('async-bar')
})