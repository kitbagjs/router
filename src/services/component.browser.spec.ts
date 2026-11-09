import { flushPromises, mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import echo from '@/components/echo'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createComponentPropsWrapper } from '@/services/component'

test('preserves the latest props when the owning route leaves', async () => {
  const first = createRoute({ name: 'first', path: '/first/[id]' })
    .addView(echo, { props: (route) => ({ value: `first:${route.params.id}` }) })
  const second = createRoute({ name: 'second', path: '/second' })
    .addView(echo, { props: () => ({ value: 'second' }) })
  const router = createRouter([first, second], { initialUrl: '/first/1' })
  await router.start()

  // Keep the wrapper mounted so unmounting cannot hide changes to its props during departure.
  const view = createComponentPropsWrapper(router.key, { id: first.id, name: 'default', component: echo })
  const wrapper = mount(view, { global: { plugins: [router] } })
  await flushPromises()
  expect(wrapper.text()).toBe('first:1')

  await router.push('/first/2')
  await flushPromises()
  expect(wrapper.text()).toBe('first:2')

  await router.push('/second')
  await flushPromises()

  expect(wrapper.text()).toBe('first:2')
})

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

  expect(wrapper.text()).toBe(fallback)

  await router.push('home')
  await flushPromises()

  expect(wrapper.findComponent(echo).exists()).toBe(false)
  expect(warn).not.toHaveBeenCalled()

  resolve({ value: 'hello world' })
  await flushPromises()

  expect(wrapper.text()).toBe('hello world')
  expect(warn).not.toHaveBeenCalled()
})
