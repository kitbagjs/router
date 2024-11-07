import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'

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
