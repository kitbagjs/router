import { expect, test, vi } from 'vitest'
import { createRoute } from './createRoute'
import { createRouter } from './createRouter'
import { flushPromises, mount } from '@vue/test-utils'
import { onAfterRouteEnter, onAfterRouteLeave, onAfterRouteUpdate, onBeforeRouteLeave, onBeforeRouteUpdate } from '@/compositions/hooks'
import { h } from 'vue'
import RouterView from '@/components/routerView.vue'

test('component hooks are called correctly', async () => {
  const parentHooks = {
    beforeEnter: vi.fn(),
    beforeLeave: vi.fn(),
    beforeUpdate: vi.fn(),
    afterEnter: vi.fn(),
    afterLeave: vi.fn(),
    afterUpdate: vi.fn(),
  }

  const childHooks = {
    beforeEnter: vi.fn(),
    beforeLeave: vi.fn(),
    beforeUpdate: vi.fn(),
    afterEnter: vi.fn(),
    afterLeave: vi.fn(),
    afterUpdate: vi.fn(),
  }

  const parent = createRoute({
    name: 'parent',
    path: '/parent',
    onBeforeRouteEnter: () => parentHooks.beforeEnter(),
    onBeforeRouteLeave: () => parentHooks.beforeLeave(),
    onBeforeRouteUpdate: () => parentHooks.beforeUpdate(),
    onAfterRouteEnter: () => parentHooks.afterEnter(),
    onAfterRouteLeave: () => parentHooks.afterLeave(),
    onAfterRouteUpdate: () => parentHooks.afterUpdate(),
    component: {
      setup() {
        onBeforeRouteLeave(() => parentHooks.beforeLeave())
        onBeforeRouteUpdate(() => parentHooks.beforeUpdate())
        onAfterRouteEnter(() => parentHooks.afterEnter())
        onAfterRouteLeave(() => parentHooks.afterLeave())
        onAfterRouteUpdate(() => parentHooks.afterUpdate())
      },
      render: () => h(RouterView),
    },
  })

  const child = createRoute({
    name: 'child',
    path: '/child/[param]',
    parent,
    component: {
      setup() {
        onBeforeRouteLeave(() => childHooks.beforeLeave())
        onBeforeRouteUpdate(() => childHooks.beforeUpdate())
        onAfterRouteEnter(() => childHooks.afterEnter())
        onAfterRouteLeave(() => childHooks.afterLeave())
        onAfterRouteUpdate(() => childHooks.afterUpdate())
      },
      render: () => h('div', 'child'),
    },
  })

  const router = createRouter([parent, child], {
    initialUrl: '/parent/child/param',
  })

  const root = {
    template: '<RouterView />',
  }

  mount(root, {
    global: {
      plugins: [router],
    },
  })

  expect(parentHooks.beforeEnter).toHaveBeenCalledTimes(1)

  await router.push('/parent/child/param2')

  expect(parentHooks.beforeEnter).toHaveBeenCalledTimes(1)
})
