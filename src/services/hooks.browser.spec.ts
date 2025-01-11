import { expect, test, vi } from 'vitest'
import { createRoute } from './createRoute'
import { createRouter } from './createRouter'
import { h } from 'vue'
import RouterView from '@/components/routerView.vue'
import { mount } from '@vue/test-utils'
import { onBeforeRouteLeave, onBeforeRouteUpdate, onAfterRouteLeave, onAfterRouteUpdate } from '@/compositions/hooks'

test('route hooks are called correctly', async () => {
  const parentHooks = {
    beforeEnter: vi.fn(),
    beforeLeave: vi.fn(),
    beforeUpdate: vi.fn(),
    afterEnter: vi.fn(),
    afterLeave: vi.fn(),
    afterUpdate: vi.fn(),
  }

  const parentA = createRoute({
    name: 'parentA',
    path: '/parentA',
    onBeforeRouteEnter: () => parentHooks.beforeEnter(),
    onBeforeRouteLeave: () => parentHooks.beforeLeave(),
    onBeforeRouteUpdate: () => parentHooks.beforeUpdate(),
    onAfterRouteEnter: () => parentHooks.afterEnter(),
    onAfterRouteLeave: () => parentHooks.afterLeave(),
    onAfterRouteUpdate: () => parentHooks.afterUpdate(),
  })

  const parentB = createRoute({
    name: 'parentB',
    path: '/parentB',
  })

  const child = createRoute({
    name: 'child',
    path: '/child/[param]',
    parent: parentA,
  })

  const router = createRouter([parentA, parentB, child], {
    initialUrl: '/parentA',
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

  expect(parentHooks.beforeEnter).toHaveBeenCalledTimes(1)
  expect(parentHooks.beforeUpdate).toHaveBeenCalledTimes(0)
  expect(parentHooks.beforeLeave).toHaveBeenCalledTimes(0)
  expect(parentHooks.afterLeave).toHaveBeenCalledTimes(0)
  expect(parentHooks.afterUpdate).toHaveBeenCalledTimes(0)
  expect(parentHooks.afterEnter).toHaveBeenCalledTimes(1)

  await router.push('child', { param: 'param2' })

  expect(parentHooks.beforeEnter).toHaveBeenCalledTimes(1)
  expect(parentHooks.beforeUpdate).toHaveBeenCalledTimes(1)
  expect(parentHooks.beforeLeave).toHaveBeenCalledTimes(0)
  expect(parentHooks.afterLeave).toHaveBeenCalledTimes(0)
  expect(parentHooks.afterUpdate).toHaveBeenCalledTimes(1)
  expect(parentHooks.afterEnter).toHaveBeenCalledTimes(1)

  await router.push('parentA')

  expect(parentHooks.beforeEnter).toHaveBeenCalledTimes(1)
  expect(parentHooks.beforeUpdate).toHaveBeenCalledTimes(2)
  expect(parentHooks.beforeLeave).toHaveBeenCalledTimes(0)
  expect(parentHooks.afterLeave).toHaveBeenCalledTimes(0)
  expect(parentHooks.afterUpdate).toHaveBeenCalledTimes(2)
  expect(parentHooks.afterEnter).toHaveBeenCalledTimes(1)

  await router.push('parentB')

  expect(parentHooks.beforeEnter).toHaveBeenCalledTimes(1)
  expect(parentHooks.beforeUpdate).toHaveBeenCalledTimes(2)
  expect(parentHooks.beforeLeave).toHaveBeenCalledTimes(1)
  expect(parentHooks.afterLeave).toHaveBeenCalledTimes(1)
  expect(parentHooks.afterUpdate).toHaveBeenCalledTimes(2)
  expect(parentHooks.afterEnter).toHaveBeenCalledTimes(1)
})

test('component hooks are called correctly', async () => {
  const parentHooks = {
    beforeUpdate: vi.fn(),
    beforeLeave: vi.fn(),
    afterLeave: vi.fn(),
    afterUpdate: vi.fn(),
  }

  const parentA = createRoute({
    name: 'parentA',
    path: '/parentA',
    component: {
      setup: () => {
        onBeforeRouteUpdate(() => parentHooks.beforeUpdate())
        onBeforeRouteLeave(() => parentHooks.beforeLeave())
        onAfterRouteLeave(() => parentHooks.afterLeave())
        onAfterRouteUpdate(() => parentHooks.afterUpdate())
      },
      render: () => h(RouterView),
    },
  })

  const parentB = createRoute({
    name: 'parentB',
    path: '/parentB',
  })

  const child = createRoute({
    name: 'child',
    path: '/child/[param]',
    parent: parentA,
  })

  const router = createRouter([parentA, parentB, child], {
    initialUrl: '/parentA',
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

  expect(parentHooks.beforeUpdate).toHaveBeenCalledTimes(0)
  expect(parentHooks.beforeLeave).toHaveBeenCalledTimes(0)
  expect(parentHooks.afterLeave).toHaveBeenCalledTimes(0)
  expect(parentHooks.afterUpdate).toHaveBeenCalledTimes(0)

  await router.push('child', { param: 'param2' })

  expect(parentHooks.beforeUpdate).toHaveBeenCalledTimes(1)
  expect(parentHooks.beforeLeave).toHaveBeenCalledTimes(0)
  expect(parentHooks.afterLeave).toHaveBeenCalledTimes(0)
  expect(parentHooks.afterUpdate).toHaveBeenCalledTimes(1)

  await router.push('parentA', {})

  expect(parentHooks.beforeUpdate).toHaveBeenCalledTimes(2)
  expect(parentHooks.beforeLeave).toHaveBeenCalledTimes(0)
  expect(parentHooks.afterLeave).toHaveBeenCalledTimes(0)
  expect(parentHooks.afterUpdate).toHaveBeenCalledTimes(2)

  await router.push('parentB')

  expect(parentHooks.beforeUpdate).toHaveBeenCalledTimes(2)
  expect(parentHooks.beforeLeave).toHaveBeenCalledTimes(1)
  expect(parentHooks.afterLeave).toHaveBeenCalledTimes(1)
  expect(parentHooks.afterUpdate).toHaveBeenCalledTimes(2)
})
