import { flushPromises, mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import echo from '@/components/echo'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'

test('renders component with sync props', async () => {
  const route = createRoute({
    name: 'echo',
    path: '/echo',
    component: echo,
  }, () => ({ value: 'echo' }))

  const router = createRouter([route], {
    initialUrl: '/',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.push('echo')

  expect(wrapper.html()).toBe('echo')
})

test('renders component with async props', async () => {
  const route = createRoute({
    name: 'echo',
    path: '/echo',
    component: echo,
  }, async () => ({ value: 'echo' }))

  const router = createRouter([route], {
    initialUrl: '/',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.push('echo')

  // needed for async props
  await flushPromises()

  expect(wrapper.html()).toBe('echo')
})

test('renders component with async props using suspense', async () => {
  const { promise, resolve } = Promise.withResolvers<{ value: string }>()
  const fallback = 'Loading...'

  const route = createRoute({
    name: 'home',
    path: '/',
    component: echo,
  }, () => promise)

  const router = createRouter([route], {
    initialUrl: '/',
  })

  await router.start()

  const root = {
    template: `
      <Suspense>
        <template #fallback>
          ${fallback}
        </template>
        <RouterView/>
      </Suspense>
    `,
  }

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.push('home')

  expect(wrapper.text()).toBe(fallback)

  resolve({ value: 'hello world' })

  await flushPromises()

  expect(wrapper.html()).toBe('hello world')
})
