import { flushPromises, mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import echo from '@/components/echo'
import { component } from '@/services/component'
import { createRouter } from '@/services/createRouter'
import { createRoutes } from '@/services/createRoutes'

test('renders component with sync props', async () => {
  const routes = createRoutes([
    {
      name: 'echo',
      path: '/echo',
      component: component(echo, () => ({ value: 'echo' })),
    },
  ])

  const router = createRouter(routes, {
    initialUrl: '/',
  })

  await router.initialized

  // purposefully not using suspense here to make sure sync props doesn't require suspense
  const root = {
    template: '<RouterView/>',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.push('echo')

  expect(app.html()).toBe('echo')
})

test('renders component with async props', async () => {
  const routes = createRoutes([
    {
      name: 'echo',
      path: '/echo',
      component: component(echo, async () => {
        return await { value: 'echo' }
      }),
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

  await router.push('echo')

  // needed because of suspense
  await flushPromises()

  expect(app.html()).toBe('echo')
})