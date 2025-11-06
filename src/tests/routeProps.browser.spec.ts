/* eslint-disable vue/one-component-per-file */
import { vi, test, expect } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { component } from '@/utilities/testHelpers'
import { RouterView } from '@/main'

test('components are not remounted when props change', async () => {
  const setupParent = vi.fn()
  const setupChild = vi.fn()

  const routeA = createRoute({
    name: 'routeA',
    path: '/[parentParam]',
    component: defineComponent({
      setup: setupParent,
      render() {
        return h(RouterView)
      },
    }),
  }, (route) => {
    return {
      parentParam: route.params.parentParam,
    }
  })

  const routeAChild = createRoute({
    parent: routeA,
    name: 'routeA.child',
    path: '/[childParam]',
    component: defineComponent({
      setup: setupChild,
      render() {
        return h(RouterView)
      },
    }),
  }, (route) => {
    return {
      value: route.params.childParam,
    }
  })

  const routeB = createRoute({
    name: 'routeB',
    path: '/routeB',
    component,
  })

  const router = createRouter([routeA, routeAChild, routeB], {
    initialUrl: '/bar',
  })

  const root = {
    template: '<RouterView />',
  }

  mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.start()

  expect(setupParent).toHaveBeenCalledTimes(1)

  // updating the current route should not remount
  await router.route.update({ parentParam: 'foo' })

  expect(setupParent).toHaveBeenCalledTimes(1)

  await router.route.update({ parentParam: 'bar' })

  // navigating away and back should not remount
  await router.push('routeB')
  await router.push('routeA', { parentParam: 'foo' })

  expect(setupParent).toHaveBeenCalledTimes(2)

  // navigating to the same route with different props should not remount
  await router.push('routeA', { parentParam: 'bar' })

  expect(setupParent).toHaveBeenCalledTimes(2)

  // navigating to a child route should not remount
  await router.push('routeA.child', { parentParam: 'foo', childParam: 'foo' })

  expect(setupParent).toHaveBeenCalledTimes(2)
  expect(setupChild).toHaveBeenCalledTimes(1)

  // updating parent param should not remount parent or child
  await router.route.update({ parentParam: 'bar' })

  expect(setupParent).toHaveBeenCalledTimes(2)
  expect(setupChild).toHaveBeenCalledTimes(1)
})
