import { test, expect, vi } from 'vitest'
import { createRoute } from './createRoute'
import { createRouter } from './createRouter'
import { createRouterPlugin } from './createRouterPlugin'
import { component, routes } from '@/utilities/testHelpers'
import { mount, flushPromises } from '@vue/test-utils'
import { createRejection } from './createRejection'

test('given a plugin, adds the routes to the router', async () => {
  const pluginRejection = createRejection({
    type: 'plugin',
    component,
  })

  const plugin = createRouterPlugin({
    routes: [createRoute({ name: 'plugin', path: '/plugin', component })],
    rejections: [pluginRejection],
  })

  const router = createRouter([], { initialUrl: '/plugin' }, [plugin])

  await router.start()

  expect(router.route.name).toBe('plugin')
})

test('given a plugin, adds the rejections to the router', async () => {
  const pluginRejection = createRejection({
    type: 'from-plugin',
    component: { template: '<div>This is a plugin rejection</div>' },
  })

  const plugin = createRouterPlugin({
    rejections: [pluginRejection],
  })

  const router = createRouter([], { initialUrl: '/' }, [plugin])

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  router.reject('from-plugin')

  await flushPromises()

  expect(wrapper.html()).toBe('<div>This is a plugin rejection</div>')
})

test('given a plugin, adds the hooks from options to the router', async () => {
  const onBeforeRouteEnterMock = vi.fn()
  const onBeforeRouteUpdateMock = vi.fn()
  const onBeforeRouteLeaveMock = vi.fn()
  const onAfterRouteEnterMock = vi.fn()
  const onAfterRouteUpdateMock = vi.fn()
  const onAfterRouteLeaveMock = vi.fn()

  const plugin = createRouterPlugin({
    onBeforeRouteEnter: [onBeforeRouteEnterMock],
    onBeforeRouteUpdate: [onBeforeRouteUpdateMock],
    onBeforeRouteLeave: [onBeforeRouteLeaveMock],
    onAfterRouteEnter: [onAfterRouteEnterMock],
    onAfterRouteUpdate: [onAfterRouteUpdateMock],
    onAfterRouteLeave: [onAfterRouteLeaveMock],
  })

  const router = createRouter(routes, { initialUrl: '/parentA/valueA' }, [plugin])

  expect(onBeforeRouteEnterMock).toHaveBeenCalledTimes(0)
  expect(onBeforeRouteUpdateMock).toHaveBeenCalledTimes(0)
  expect(onBeforeRouteLeaveMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteLeaveMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteUpdateMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteEnterMock).toHaveBeenCalledTimes(0)

  await router.start()

  expect(onBeforeRouteEnterMock).toHaveBeenCalledTimes(1)
  expect(onBeforeRouteUpdateMock).toHaveBeenCalledTimes(0)
  expect(onBeforeRouteLeaveMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteLeaveMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteUpdateMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteEnterMock).toHaveBeenCalledTimes(1)

  await router.push('parentA.childA', { paramA: 'valueA', paramB: 'valueB' })

  expect(onBeforeRouteEnterMock).toHaveBeenCalledTimes(2)
  expect(onBeforeRouteUpdateMock).toHaveBeenCalledTimes(1)
  expect(onBeforeRouteLeaveMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteLeaveMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteUpdateMock).toHaveBeenCalledTimes(1)
  expect(onAfterRouteEnterMock).toHaveBeenCalledTimes(2)

  await router.push('parentA.childB', { paramA: 'valueB', paramD: 'valueD' })

  expect(onBeforeRouteEnterMock).toHaveBeenCalledTimes(3)
  expect(onBeforeRouteUpdateMock).toHaveBeenCalledTimes(2)
  expect(onBeforeRouteLeaveMock).toHaveBeenCalledTimes(1)
  expect(onAfterRouteLeaveMock).toHaveBeenCalledTimes(1)
  expect(onAfterRouteUpdateMock).toHaveBeenCalledTimes(2)
  expect(onAfterRouteEnterMock).toHaveBeenCalledTimes(3)

  await router.push('parentB')

  expect(onBeforeRouteEnterMock).toHaveBeenCalledTimes(4)
  expect(onBeforeRouteUpdateMock).toHaveBeenCalledTimes(2)
  expect(onBeforeRouteLeaveMock).toHaveBeenCalledTimes(2)
  expect(onAfterRouteLeaveMock).toHaveBeenCalledTimes(2)
  expect(onAfterRouteUpdateMock).toHaveBeenCalledTimes(2)
  expect(onAfterRouteEnterMock).toHaveBeenCalledTimes(4)
})

test('given a plugin, adds the hooks  to the router', async () => {
  const onBeforeRouteEnterMock = vi.fn()
  const onBeforeRouteUpdateMock = vi.fn()
  const onBeforeRouteLeaveMock = vi.fn()
  const onAfterRouteEnterMock = vi.fn()
  const onAfterRouteUpdateMock = vi.fn()
  const onAfterRouteLeaveMock = vi.fn()

  const plugin = createRouterPlugin({})

  plugin.onBeforeRouteEnter(onBeforeRouteEnterMock)
  plugin.onBeforeRouteUpdate(onBeforeRouteUpdateMock)
  plugin.onBeforeRouteLeave(onBeforeRouteLeaveMock)
  plugin.onAfterRouteEnter(onAfterRouteEnterMock)
  plugin.onAfterRouteUpdate(onAfterRouteUpdateMock)
  plugin.onAfterRouteLeave(onAfterRouteLeaveMock)

  const router = createRouter(routes, { initialUrl: '/parentA/valueA' }, [plugin])

  expect(onBeforeRouteEnterMock).toHaveBeenCalledTimes(0)
  expect(onBeforeRouteUpdateMock).toHaveBeenCalledTimes(0)
  expect(onBeforeRouteLeaveMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteLeaveMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteUpdateMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteEnterMock).toHaveBeenCalledTimes(0)

  await router.start()

  expect(onBeforeRouteEnterMock).toHaveBeenCalledTimes(1)
  expect(onBeforeRouteUpdateMock).toHaveBeenCalledTimes(0)
  expect(onBeforeRouteLeaveMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteLeaveMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteUpdateMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteEnterMock).toHaveBeenCalledTimes(1)

  await router.push('parentA.childA', { paramA: 'valueA', paramB: 'valueB' })

  expect(onBeforeRouteEnterMock).toHaveBeenCalledTimes(2)
  expect(onBeforeRouteUpdateMock).toHaveBeenCalledTimes(1)
  expect(onBeforeRouteLeaveMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteLeaveMock).toHaveBeenCalledTimes(0)
  expect(onAfterRouteUpdateMock).toHaveBeenCalledTimes(1)
  expect(onAfterRouteEnterMock).toHaveBeenCalledTimes(2)

  await router.push('parentA.childB', { paramA: 'valueB', paramD: 'valueD' })

  expect(onBeforeRouteEnterMock).toHaveBeenCalledTimes(3)
  expect(onBeforeRouteUpdateMock).toHaveBeenCalledTimes(2)
  expect(onBeforeRouteLeaveMock).toHaveBeenCalledTimes(1)
  expect(onAfterRouteLeaveMock).toHaveBeenCalledTimes(1)
  expect(onAfterRouteUpdateMock).toHaveBeenCalledTimes(2)
  expect(onAfterRouteEnterMock).toHaveBeenCalledTimes(3)

  await router.push('parentB')

  expect(onBeforeRouteEnterMock).toHaveBeenCalledTimes(4)
  expect(onBeforeRouteUpdateMock).toHaveBeenCalledTimes(2)
  expect(onBeforeRouteLeaveMock).toHaveBeenCalledTimes(2)
  expect(onAfterRouteLeaveMock).toHaveBeenCalledTimes(2)
  expect(onAfterRouteUpdateMock).toHaveBeenCalledTimes(2)
  expect(onAfterRouteEnterMock).toHaveBeenCalledTimes(4)
})
