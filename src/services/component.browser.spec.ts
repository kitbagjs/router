import { flushPromises, mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { defineAsyncComponent } from 'vue'
import echo from '@/components/echo'
import { component } from '@/services/component'
import { createRouter } from '@/services/createRouter'
import { createRoutes } from '@/services/createRoutes'

test('renders component with props', async () => {
  const routes = createRoutes([
    {
      name: 'one',
      path: '/one',
      component: component(echo, () => ({ value: 'one' })),
    },
    {
      name: 'two',
      path: '/two',
      component: component(echo, async () => {
        return await { value: 'two' }
      }),
    },
    {
      name: 'three',
      path: '/three',
      component: component(defineAsyncComponent(() => import('@/components/echo')), () => ({ value: 'three' })),
    },
  ])

  const router = createRouter(routes, {
    initialUrl: '/',
  })

  await router.initialized

  const root = {
    template: '<Suspense><RouterView/></Suspense>',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.push('one')
  await flushPromises()

  expect(app.html()).toBe('one')

  await router.push('two')
  await flushPromises()

  expect(app.html()).toBe('two')

  await router.push('three')
  await flushPromises()

  expect(app.html()).toBe('three')
})