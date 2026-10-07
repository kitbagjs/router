import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'
import { createRejection } from './createRejection'
import echo from '@/components/echo'

test('after enter and update hooks see the committed destination route', async () => {
  const route = createRoute({
    name: 'destination',
    path: '/destination/[value]',
    component: echo,
  }, (route) => ({ value: route.params.value }))
  const router = createRouter([route], { initialUrl: '/', historyMode: 'memory' })
  await router.start()

  const afterEnter = vi.fn((to) => {
    expect(router.route.href).toBe(to.href)
    if (router.route.name !== 'destination') {
      throw new Error('Expected destination')
    }

    expect(router.route.params.value).toBe('first')
  })
  const afterUpdate = vi.fn((to) => {
    expect(router.route.href).toBe(to.href)
    if (router.route.name !== 'destination') {
      throw new Error('Expected destination')
    }

    expect(router.route.params.value).toBe('second')
  })
  router.onAfterRouteEnter(afterEnter)
  router.onAfterRouteUpdate(afterUpdate)

  await router.push('destination', { value: 'first' })
  await router.push('destination', { value: 'second' })

  expect(afterEnter).toHaveBeenCalledOnce()
  expect(afterUpdate).toHaveBeenCalledOnce()
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

    expect(router.route.name).toBe('CustomRejection')
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
