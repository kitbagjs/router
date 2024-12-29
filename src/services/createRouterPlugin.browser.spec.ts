import { test, expect, vi } from "vitest"
import { createRoute } from "./createRoute"
import { createRouter } from "./createRouter"
import { createRouterPlugin } from "./createRouterPlugin"
import { component, routes } from "@/utilities/testHelpers"
import { flushPromises } from "@vue/test-utils"
import { mount } from "@vue/test-utils"

test('given a plugin, adds the routes to the router', async () => {
  const plugin = createRouterPlugin({
    routes: [createRoute({ name: 'plugin', path: '/plugin', component })],
    rejections: {
      'plugin': component,
    },
  })

  const router = createRouter([], { initialUrl: '/plugin' }, [plugin])

  await router.start()

  expect(router.route.name).toBe('plugin')
})

test('given a plugin, adds the rejections to the router', async () => {
  const plugin = createRouterPlugin({
    rejections: {
      'plugin': { template: '<div>This is a plugin rejection</div>' },
    },
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

  await router.reject('plugin')

  await flushPromises()

  expect(wrapper.html()).toBe('<div>This is a plugin rejection</div>')
})

test('given a plugin, adds the hooks to the router', async () => {
  const plugin = createRouterPlugin({
    onBeforeRouteEnter: vi.fn(),
    onBeforeRouteUpdate: vi.fn(),
    onBeforeRouteLeave: vi.fn(),
    onAfterRouteEnter: vi.fn(),
    onAfterRouteUpdate: vi.fn(),
    onAfterRouteLeave: vi.fn(),
  })

  const router = createRouter(routes, { initialUrl: '/parentA/valueA' }, [plugin])

  await router.start()

  expect(plugin.onBeforeRouteEnter).toHaveBeenCalledTimes(1)
  expect(plugin.onAfterRouteEnter).toHaveBeenCalledTimes(1)
  
  await router.push('parentA.childA', { paramA: 'valueA', paramB: 'valueB' })
  
  expect(plugin.onBeforeRouteEnter).toHaveBeenCalledTimes(2)
  expect(plugin.onBeforeRouteUpdate).toHaveBeenCalledTimes(1)
  expect(plugin.onAfterRouteUpdate).toHaveBeenCalledTimes(1)
  expect(plugin.onAfterRouteEnter).toHaveBeenCalledTimes(2)
  
  await router.push('parentA.childB', { paramA: 'valueB', paramD: 'valueD' })

  expect(plugin.onBeforeRouteEnter).toHaveBeenCalledTimes(3)
  expect(plugin.onBeforeRouteUpdate).toHaveBeenCalledTimes(2)
  expect(plugin.onBeforeRouteLeave).toHaveBeenCalledTimes(1)
  expect(plugin.onAfterRouteLeave).toHaveBeenCalledTimes(1)
  expect(plugin.onAfterRouteUpdate).toHaveBeenCalledTimes(2)
  expect(plugin.onAfterRouteEnter).toHaveBeenCalledTimes(3)
})
