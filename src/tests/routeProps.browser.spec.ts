import { vi, test, expect } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { component } from '@/utilities/testHelpers'

test('components are not remounted when props change', async () => {
  const setup = vi.fn()

  const routeA = createRoute({
    name: 'routeA',
    path: '/routeA/[param]',
    component: defineComponent({
      setup,
      render() {
        return h('div', {}, 'test')
      },
    }),
  })

  const routeB = createRoute({
    name: 'routeB',
    path: '/routeB',
    component,
  })

  const router = createRouter([routeA, routeB], {
    initialUrl: '/routeA/bar',
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

  await router.route.update({ param: 'foo' })

  expect(setup).toHaveBeenCalledTimes(1)

  await router.route.update({ param: 'bar' })

  expect(setup).toHaveBeenCalledTimes(1)

  await router.route.update({ param: 'foo' })

  expect(setup).toHaveBeenCalledTimes(1)

  await router.push('routeB')

  await router.push('routeA', { param: 'foo' })

  expect(setup).toHaveBeenCalledTimes(2)
})
