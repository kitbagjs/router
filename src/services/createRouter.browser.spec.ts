import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'
import { createRejection } from './createRejection'
import { nextTick } from 'vue'
import echo from '@/components/echo'

test('after hooks can await the destination DOM when a route mounts and when its props change', async () => {
  const route = createRoute({ name: 'destination', path: '/destination/[value]', component: echo }, (route) => ({ value: route.params.value }))
  const router = createRouter([route], { initialUrl: '/', historyMode: 'memory' })
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })
  await router.start()
  const rendered: string[] = []
  router.onAfterRouteEnter(async () => {
    await nextTick()
    rendered.push(wrapper.text())
  })
  router.onAfterRouteUpdate(async () => {
    await nextTick()
    rendered.push(wrapper.text())
  })

  await router.push('destination', { value: 'first' })
  await router.push('destination', { value: 'second' })

  expect(rendered).toEqual(['first', 'second'])
  wrapper.unmount()
})

test('after hooks do not wait for pending props or loaders', async () => {
  const props = Promise.withResolvers<{ value: string }>()
  const loader = Promise.withResolvers<string>()
  const route = createRoute({ name: 'destination', path: '/destination', component: echo }, () => props.promise).addLoader(() => loader.promise)
  const router = createRouter([route], { initialUrl: '/', historyMode: 'memory' })
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })
  await router.start()
  const after = vi.fn()
  router.onAfterRouteEnter(after)

  await router.push('destination')

  expect(after).toHaveBeenCalledOnce()
  expect(wrapper.text()).toBe('')
  props.resolve({ value: 'ready' })
  loader.resolve('ready')
  await flushPromises()
  expect(wrapper.text()).toBe('ready')
  wrapper.unmount()
})

test('Router is automatically started when installed', async () => {
  const route = createRoute({
    name: 'root',
    path: '/',
    component,
  })

  const router = createRouter([route], {
    initialUrl: '/',
  })

  const root = {
    template: '<RouterView/>',
  }

  expect(router.route.name).toBe('NotFound')

  mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.start()

  expect(router.route.name).toBe('root')
})

describe('options.rejections', () => {
  test('given a rejection, adds the rejection to the router', async () => {
    const route = createRoute({
      name: 'root',
      path: '/',
      component,
    })

    const customRejection = createRejection({
      type: 'CustomRejection',

      status: 404,
      component: { template: '<div>This is a custom rejection</div>' },
    })

    const router = createRouter([route], {
      initialUrl: '/',
      rejections: [customRejection],
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

    expect(router.route.name).toBe('root')

    router.reject('CustomRejection')

    await flushPromises()

    expect(router.route.name).toBe('root')
    expect(window.location.pathname).toBe('/')

    expect(wrapper.html()).toBe('<div>This is a custom rejection</div>')
  })
})

test('given child has hoist, keeps parent context and components without parent url', async () => {
  const parent = createRoute({
    name: 'parent',
    path: '/parent',
    component: { template: '<div class="parent"><RouterView/></div>' },
  })

  const child = createRoute({
    name: 'child',
    parent,
    hoist: true,
    path: '/child/[?child]',
    component: { template: '<i class="child" />' },
  })

  const router = createRouter([child], { initialUrl: '/' })

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.start()

  await router.push('child', { child: '42' })

  expect(router.route).toMatchObject(expect.objectContaining({
    name: 'child',
    href: '/child/42',
  }))

  expect(wrapper.html()).toBe('<div class="parent"><i class="child"></i></div>')
})
