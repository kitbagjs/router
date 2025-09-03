import { expect, test, vi } from 'vitest'
import { createRoute } from './createRoute'
import { createRouter } from './createRouter'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { RouterView, onBeforeRouteLeave, onBeforeRouteUpdate, onAfterRouteLeave, onAfterRouteUpdate } from '@/main'
import { routes } from '@/utilities/testHelpers'

test('global hooks passed as options are called correctly', async () => {
  const onBeforeRouteEnter = vi.fn()
  const onBeforeRouteUpdate = vi.fn()
  const onBeforeRouteLeave = vi.fn()
  const onAfterRouteEnter = vi.fn()
  const onAfterRouteUpdate = vi.fn()
  const onAfterRouteLeave = vi.fn()

  const router = createRouter(routes, {
    initialUrl: '/parentA/valueA',
    onBeforeRouteEnter,
    onBeforeRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onAfterRouteUpdate,
    onAfterRouteLeave,
  })

  await router.start()

  expect(onBeforeRouteEnter).toHaveBeenCalledTimes(1)
  expect(onBeforeRouteUpdate).toHaveBeenCalledTimes(0)
  expect(onBeforeRouteLeave).toHaveBeenCalledTimes(0)
  expect(onAfterRouteLeave).toHaveBeenCalledTimes(0)
  expect(onAfterRouteUpdate).toHaveBeenCalledTimes(0)
  expect(onAfterRouteEnter).toHaveBeenCalledTimes(1)

  await router.push('parentA.childA', { paramA: 'valueA', paramB: 'valueB' })

  expect(onBeforeRouteEnter).toHaveBeenCalledTimes(2)
  expect(onBeforeRouteUpdate).toHaveBeenCalledTimes(1)
  expect(onBeforeRouteLeave).toHaveBeenCalledTimes(0)
  expect(onAfterRouteLeave).toHaveBeenCalledTimes(0)
  expect(onAfterRouteUpdate).toHaveBeenCalledTimes(1)
  expect(onAfterRouteEnter).toHaveBeenCalledTimes(2)

  await router.push('parentA.childB', { paramA: 'valueB', paramD: 'valueD' })

  expect(onBeforeRouteEnter).toHaveBeenCalledTimes(3)
  expect(onBeforeRouteUpdate).toHaveBeenCalledTimes(2)
  expect(onBeforeRouteLeave).toHaveBeenCalledTimes(1)
  expect(onAfterRouteLeave).toHaveBeenCalledTimes(1)
  expect(onAfterRouteUpdate).toHaveBeenCalledTimes(2)
  expect(onAfterRouteEnter).toHaveBeenCalledTimes(3)

  await router.push('parentB')

  expect(onBeforeRouteEnter).toHaveBeenCalledTimes(4)
  expect(onBeforeRouteUpdate).toHaveBeenCalledTimes(2)
  expect(onBeforeRouteLeave).toHaveBeenCalledTimes(2)
  expect(onAfterRouteLeave).toHaveBeenCalledTimes(2)
  expect(onAfterRouteUpdate).toHaveBeenCalledTimes(2)
  expect(onAfterRouteEnter).toHaveBeenCalledTimes(4)
})

test('global hooks registered manually are called correctly', async () => {
  const router = createRouter(routes, { initialUrl: '/parentA/valueA' })

  const onBeforeRouteEnter = vi.fn()
  const onBeforeRouteUpdate = vi.fn()
  const onBeforeRouteLeave = vi.fn()
  const onAfterRouteEnter = vi.fn()
  const onAfterRouteUpdate = vi.fn()
  const onAfterRouteLeave = vi.fn()

  router.onBeforeRouteEnter(onBeforeRouteEnter)
  router.onAfterRouteEnter(onAfterRouteEnter)
  router.onBeforeRouteUpdate(onBeforeRouteUpdate)
  router.onAfterRouteUpdate(onAfterRouteUpdate)
  router.onBeforeRouteLeave(onBeforeRouteLeave)
  router.onAfterRouteLeave(onAfterRouteLeave)

  await router.start()

  expect(onBeforeRouteEnter).toHaveBeenCalledTimes(1)
  expect(onBeforeRouteUpdate).toHaveBeenCalledTimes(0)
  expect(onBeforeRouteLeave).toHaveBeenCalledTimes(0)
  expect(onAfterRouteLeave).toHaveBeenCalledTimes(0)
  expect(onAfterRouteUpdate).toHaveBeenCalledTimes(0)
  expect(onAfterRouteEnter).toHaveBeenCalledTimes(1)

  await router.push('parentA.childA', { paramA: 'valueA', paramB: 'valueB' })

  expect(onBeforeRouteEnter).toHaveBeenCalledTimes(2)
  expect(onBeforeRouteUpdate).toHaveBeenCalledTimes(1)
  expect(onBeforeRouteLeave).toHaveBeenCalledTimes(0)
  expect(onAfterRouteLeave).toHaveBeenCalledTimes(0)
  expect(onAfterRouteUpdate).toHaveBeenCalledTimes(1)
  expect(onAfterRouteEnter).toHaveBeenCalledTimes(2)

  await router.push('parentA.childB', { paramA: 'valueB', paramD: 'valueD' })

  expect(onBeforeRouteEnter).toHaveBeenCalledTimes(3)
  expect(onBeforeRouteUpdate).toHaveBeenCalledTimes(2)
  expect(onBeforeRouteLeave).toHaveBeenCalledTimes(1)
  expect(onAfterRouteLeave).toHaveBeenCalledTimes(1)
  expect(onAfterRouteUpdate).toHaveBeenCalledTimes(2)
  expect(onAfterRouteEnter).toHaveBeenCalledTimes(3)

  await router.push('parentB')

  expect(onBeforeRouteEnter).toHaveBeenCalledTimes(4)
  expect(onBeforeRouteUpdate).toHaveBeenCalledTimes(2)
  expect(onBeforeRouteLeave).toHaveBeenCalledTimes(2)
  expect(onAfterRouteLeave).toHaveBeenCalledTimes(2)
  expect(onAfterRouteUpdate).toHaveBeenCalledTimes(2)
  expect(onAfterRouteEnter).toHaveBeenCalledTimes(4)
})

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
