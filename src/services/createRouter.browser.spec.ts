import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'
import { createRejection } from './createRejection'

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
      component: { template: '<div>This is a custom rejection</div>' },
    })

    const router = createRouter([route], {
      initialUrl: '/',
      rejections: [customRejection],
    })

    route.onBeforeRouteUpdate((_to, { push }) => {
      // ok
      push('root')
      // @ts-expect-error does not know about routes outside of context
      push('fakeRoute')
    })

    router.onBeforeRouteUpdate((_to, { push }) => {
      // ok
      push('root')
      // @ts-expect-error does not know about routes outside of router
      push('fakeRoute')
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
