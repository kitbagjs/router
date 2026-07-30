import { mount, flushPromises } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { defineAsyncComponent, h } from 'vue'
import echo from '@/components/echo'
import helloWorld from '@/components/helloWorld'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component, routes } from '@/utilities/testHelpers'
import { RouterLink } from '@/main'
import { createRejection } from '@/services/createRejection'

test('renders component for initial route', async () => {
  const route = createRoute({
    name: 'foo',
    path: '/',
  })
    .addView({ template: 'hello world' })

  const router = createRouter([route], {
    initialUrl: '/',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.html()).toBe('hello world')
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
  })
    .addView({ template: 'Child' })

  const router = createRouter([parentRoute, childRoute], {
    initialUrl: '/parent/child',
  })

  await router.start()

  const root = {
    template: '<RouterView />',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.html()).toBe('Child')
})

test('does not render component when router is not started', async () => {
  const route = createRoute({
    name: 'foo',
    path: '/',
  })
    .addView({ template: 'hello world' })

  const router = createRouter([route], {
    initialUrl: '/',
  })

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.text()).toBe('')

  await router.start()

  expect(wrapper.text()).toBe('hello world')
})

test('updates components when route changes', async () => {
  const routes = [
    createRoute({
      name: 'foo',
      path: '/foo',
    })
      .addView({ template: 'Foo' }),
    createRoute({
      name: 'bar',
      path: '/bar',
    })
      .addView({ template: 'Bar' }),
    createRoute({
      name: 'zoo',
      path: '/zoo',
    })
      .addView({ template: 'Zoo' }),
  ] as const

  const router = createRouter(routes, {
    initialUrl: '/foo',
  })

  const root = {
    template: '<RouterView />',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.start()

  expect(wrapper.html()).toBe('Foo')

  await router.push('/bar')

  expect(wrapper.html()).toBe('Bar')

  await router.push('/zoo')

  expect(wrapper.html()).toBe('Zoo')

  await router.push('/foo')

  expect(wrapper.html()).toBe('Foo')
})

test('resolves async components', async () => {
  const route = createRoute({
    name: 'async',
    path: '/',
  })
    .addView(defineAsyncComponent(() => import('./helloWorld')))

  const router = createRouter([route], {
    initialUrl: '/',
  })

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.start()
  await flushPromises()
  await flushPromises()
  await flushPromises()

  expect(wrapper.html()).toBe(helloWorld.template)
})

test('Renders the genericRejection component when the initialUrl does not match', async () => {
  const router = createRouter([], {
    initialUrl: '/does-not-exist',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.text()).toBe('NotFound')
})

test('Renders custom genericRejection component when the initialUrl does not match', async () => {
  const NotFound = { template: 'Custom Not Found' }
  const notFoundRejection = createRejection({
    type: 'NotFound',
    component: NotFound,
  })

  const router = createRouter(routes, {
    initialUrl: '/does-not-exist',
    rejections: [notFoundRejection],
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  const { views } = router.route.matched
  const rejectionComponent = 'default' in views ? views.default.component : undefined

  if (!rejectionComponent) {
    throw new Error('Matched route does not have a default view')
  }

  const route = mount(rejectionComponent)

  expect(wrapper.text()).toBe(NotFound.template)
  expect(route.text()).toBe(NotFound.template)
})

test('Renders the NotFound component when the router.push does not match', async () => {
  const route = createRoute({
    name: 'foo',
    path: '/',
  })
    .addView({ template: 'hello world' })

  const router = createRouter([route], {
    initialUrl: '/',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.push('/does-not-exist')

  expect(wrapper.text()).toBe('NotFound')
})

test('Renders the route component when the router.push does match after a rejection', async () => {
  const route = createRoute({
    name: 'foo',
    path: '/',
  })
    .addView({ template: 'hello world' })

  const router = createRouter([route], {
    initialUrl: '/does-not-exist',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.text()).toBe('NotFound')

  await router.push('/')

  expect(wrapper.text()).toBe('hello world')
})

test('Renders the multiple components when using named route views', async () => {
  const route = createRoute({
    name: 'foo',
    path: '/',
  })
    .addView({ template: '_default_' }, { name: 'default' })
    .addView({ template: '_one_' }, { name: 'one' })
    .addView({ template: '_two_' }, { name: 'two' })

  const router = createRouter([route], {
    initialUrl: '/',
  })

  await router.start()

  const root = {
    template: `
      <RouterView name="one" />
      <RouterView />
      <RouterView name="two" />
    `,
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.text()).toBe('_one__default__two_')
})

test('Binds props and attrs from route', async () => {
  const routeA = createRoute({
    name: 'routeA',
    path: '/routeA/[param]',
  })
    .addView(echo, { props: (route) => ({ value: route.params.param }) })

  const routeB = createRoute({
    name: 'routeB',
    path: '/routeB/[param]',
  })
    .addView(echo, { props: (route) => ({ value: route.params.param }) })

  const router = createRouter([routeA, routeB], {
    initialUrl: '/',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.push('/routeA/hello')

  expect(wrapper.html()).toBe('hello')

  await router.push('/routeB/world')

  expect(wrapper.html()).toBe('world')
})

test('Updates props and attrs when route params change', async () => {
  const syncProps = createRoute({
    name: 'sync',
    path: '/sync/[param]',
  })
    .addView(echo, { props: (route) => ({ value: route.params.param }) })

  const asyncProps = createRoute({
    name: 'async',
    path: '/async/[param]',
  })
    .addView(echo, { props: async (route) => ({ value: route.params.param }) })

  const router = createRouter([syncProps, asyncProps], {
    initialUrl: '/',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.push('sync', { param: 'foo' })

  expect(wrapper.html()).toBe('foo')

  await router.push('sync', { param: 'bar' })

  expect(wrapper.html()).toBe('bar')

  await router.push('async', { param: 'async-foo' })

  await flushPromises()

  expect(wrapper.html()).toBe('async-foo')

  await router.push('async', { param: 'async-bar' })

  await flushPromises()

  expect(wrapper.html()).toBe('async-bar')
})

test('Props from route can trigger push', async () => {
  const routeA = createRoute({
    name: 'routeA',
    path: '/routeA',
  })
    .addView(echo, {
      props: (__, context) => {
        throw context.push('/routeB')
      },
    })

  const routeB = createRoute({
    name: 'routeB',
    path: '/routeB',
  })
    .addView(echo, {
      props: () => ({
        value: 'routeB',
      }),
    })

  const router = createRouter([routeA, routeB], {
    initialUrl: '/',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.push('/routeA')

  await flushPromises()

  expect(wrapper.html()).toBe('routeB')
})

test('Props from route can trigger reject', async () => {
  const routeA = createRoute({
    name: 'routeA',
    path: '/routeA',
  })
    .addView(echo, {
      props: (__, context) => {
        throw context.reject('NotFound')
      },
    })

  const router = createRouter([routeA], {
    initialUrl: '/',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.push('/routeA')

  await flushPromises()

  expect(wrapper.html()).toBe('<h1>NotFound</h1>')
})

test('prefetched props trigger push when navigation is initiated', async () => {
  const routeA = createRoute({
    name: 'routeA',
    path: '/routeA',
  })
    .addView({ render: () => h(RouterLink, { to: (resolve) => resolve('routeB') }, () => 'routeB') })

  const routeB = createRoute({
    name: 'routeB',
    path: '/routeB',
    prefetch: { props: true },
  })
    .addView(echo, {
      props: (__, { push }) => {
        throw push('/routeC')
      },
    })

  const routeC = createRoute({
    name: 'routeC',
    path: '/routeC',
  })
    .addView(echo, {
      props: () => ({
        value: 'routeC',
      }),
    })

  const router = createRouter([routeA, routeB, routeC], {
    initialUrl: '/routeA',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.text()).toBe('routeB')

  wrapper.find('a').trigger('click')

  await flushPromises()

  expect(wrapper.text()).toBe('routeC')
})

test('prefetched async props trigger push when navigation is initiated', async () => {
  const routeA = createRoute({
    name: 'routeA',
    path: '/routeA',
  })
    .addView({ render: () => h(RouterLink, { to: (resolve) => resolve('routeB') }, () => 'routeB') })

  const routeB = createRoute({
    name: 'routeB',
    path: '/routeB',
    prefetch: { props: true },
  })
    .addView(component, {
      props: (__, { push }) => {
        throw push('/routeC')
      },
    })

  const routeC = createRoute({
    name: 'routeC',
    path: '/routeC',
  })
    .addView(echo, {
      props: () => ({
        value: 'routeC',
      }),
    })

  const router = createRouter([routeA, routeB, routeC], {
    initialUrl: '/routeA',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.text()).toBe('routeB')

  wrapper.find('a').trigger('click')

  await flushPromises()

  expect(wrapper.text()).toBe('routeC')
})

test('Renders correct component when using default slot', async () => {
  const myRejection = createRejection({
    type: 'myRejection',
    component: {
      template: 'My Rejection',
    },
  })

  const foo = createRoute({
    name: 'foo',
    path: '/foo',
  })
    .addView({
      template: 'Foo',
    })

  const bar = createRoute({
    name: 'bar',
    path: '/bar',
  })
    .addView({
      template: 'Bar',
    })

  const router = createRouter([foo, bar], {
    initialUrl: '/foo',
    rejections: [myRejection],
  })

  await router.start()

  const wrapper = mount({
    template: `
      <router-view>
        <template #default="{ component }">
          <transition name="fade">
            <component :is="component" />
          </transition>
        </template>
      </router-view>
      `,
  }, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.text()).toBe('Foo')

  await router.push('bar')

  expect(wrapper.text()).toBe('Bar')

  router.reject('myRejection')

  await flushPromises()

  expect(wrapper.text()).toBe('My Rejection')
})

test('Renders the rejection component when the rejection is not registered on the router', async () => {
  const rejectionText = 'Rejection content to render'
  const myRejection = createRejection({
    type: 'myRejection',
    component: {
      template: rejectionText,
    },
  })

  const route = createRoute({
    name: 'foo',
    path: '/',
    context: [myRejection],
  })
    .addView({ template: 'Should not be rendered' })

  route.onBeforeRouteEnter((_to, { reject }) => {
    throw reject('myRejection')
  })

  const router = createRouter([route], {
    initialUrl: '/',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await flushPromises()

  expect(wrapper.text()).toBe(rejectionText)
})
