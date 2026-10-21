import { flushPromises, mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import echo from '@/components/echo'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'

test('renders component with sync props', async () => {
  const route = createRoute({
    name: 'echo',
    path: '/echo',
  })
    .addView(echo, { props: () => ({ value: 'echo' }) })

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
  })
    .addView(echo, { props: async () => ({ value: 'echo' }) })

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
  })
    .addView(echo, { props: () => promise })

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

  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  try {
    expect(wrapper.text()).toBe(fallback)

    await router.push('home')
    await flushPromises()

    expect(wrapper.findComponent(echo).exists()).toBe(false)
    expect(warn).not.toHaveBeenCalled()

    resolve({ value: 'hello world' })
    await flushPromises()

    expect(wrapper.text()).toBe('hello world')
    expect(warn).not.toHaveBeenCalled()
  } finally {
    wrapper.unmount()
    warn.mockRestore()
  }
})
