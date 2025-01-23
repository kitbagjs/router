import { vi, test, expect } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

test('components are not remounted when props change', async () => {
  const props = vi.fn().mockImplementation(() => ({ prop: 'foo' }))
  const setup = vi.fn()

  const route = createRoute({
    name: 'test',
    path: '/[param]',
    component: defineComponent({
      setup() {
        setup()

        return { props }
      },
      render() {
        return h('div', {}, 'test')
      },
    }),
  }, props)

  const router = createRouter([route], {
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

  await router.route.update({ param: 'foo' })

  expect(setup).toHaveBeenCalledTimes(1)

  await router.route.update({ param: 'bar' })

  expect(setup).toHaveBeenCalledTimes(1)

  await router.route.update({ param: 'foo' })

  expect(setup).toHaveBeenCalledTimes(1)
})
