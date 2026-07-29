import { expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import echo from '@/components/echo'

test('renders the default view added via addView', async () => {
  const route = createRoute({ name: 'route', path: '/' }).addView({ template: 'hello world' })

  const router = createRouter([route], { initialUrl: '/' })

  await router.start()

  const wrapper = mount({ template: '<RouterView />' }, {
    global: { plugins: [router] },
  })

  expect(wrapper.text()).toBe('hello world')
})

test('renders default and named views added via addView', async () => {
  const route = createRoute({ name: 'route', path: '/' })
    .addView({ template: '_default_' })
    .addView({ template: '_one_' }, { name: 'one' })
    .addView({ template: '_two_' }, { name: 'two' })

  const router = createRouter([route], { initialUrl: '/' })

  await router.start()

  const wrapper = mount({
    template: `
      <RouterView name="one" />
      <RouterView />
      <RouterView name="two" />
    `,
  }, {
    global: { plugins: [router] },
  })

  expect(wrapper.text()).toBe('_one__default__two_')
})

test('binds props from an addView getter for the default view', async () => {
  const route = createRoute({ name: 'route', path: '/[param]' }).addView(echo, { props: (route) => ({ value: route.params.param }) })

  const router = createRouter([route], { initialUrl: '/hello' })

  await router.start()

  const wrapper = mount({ template: '<RouterView />' }, {
    global: { plugins: [router] },
  })

  expect(wrapper.text()).toBe('hello')
})

test('binds props to named views added via addView', async () => {
  const route = createRoute({ name: 'route', path: '/[param]' })
    .addView(echo, { name: 'one', props: (route) => ({ value: `one-${route.params.param}` }) })
    .addView(echo, { name: 'two', props: (route) => ({ value: `two-${route.params.param}` }) })

  const router = createRouter([route], { initialUrl: '/x' })

  await router.start()

  const wrapper = mount({
    template: `
      <RouterView name="one" />
      <RouterView name="two" />
    `,
  }, {
    global: { plugins: [router] },
  })

  expect(wrapper.text()).toBe('one-xtwo-x')
})

test('renders parent and child views added via addView', async () => {
  const parent = createRoute({ name: 'parent', path: '/parent' }).addView({ template: 'parent-<RouterView />' })
  const child = createRoute({ name: 'child', parent, path: '/child' }).addView({ template: 'child' })

  const router = createRouter([parent, child], { initialUrl: '/parent/child' })

  await router.start()

  const wrapper = mount({ template: '<RouterView />' }, {
    global: { plugins: [router] },
  })

  expect(wrapper.text()).toBe('parent-child')
})

test('a route defined with addView still runs its hooks and renders its view', async () => {
  const onEnter = vi.fn()

  const route = createRoute({ name: 'route', path: '/' }).addView({ template: 'hello world' })

  route.onBeforeRouteEnter(onEnter)

  const router = createRouter([route], { initialUrl: '/' })

  await router.start()

  const wrapper = mount({ template: '<RouterView />' }, {
    global: { plugins: [router] },
  })

  expect(wrapper.text()).toBe('hello world')
  expect(onEnter).toHaveBeenCalledOnce()
})
