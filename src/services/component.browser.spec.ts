import { flushPromises, mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import echo from '@/components/echo'
import { component } from '@/services/component'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { h } from 'vue'
import { defineComponent } from 'vue'
import { getCurrentInstance } from 'vue'

test('renders component with sync props', async () => {
  const route = createRoute({
    name: 'echo',
    path: '/echo',
    component: component(echo, () => ({ value: 'echo' })),
  })

  const router = createRouter([route], {
    initialUrl: '/',
  })

  await router.start()

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
  const route = createRoute({
    name: 'echo',
    path: '/echo',
    component: component(echo, async () => {
      return { value: 'echo' }
    }),
  })

  const router = createRouter([route], {
    initialUrl: '/',
  })

  await router.start()

  const root = {
    template: '<RouterView/>',
  }

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.push('echo')

  // needed for async props
  await flushPromises()

  expect(app.html()).toBe('echo')
})

test('component instance has suspense property when suspense is used', async () => {
  const testComponent = defineComponent({
    setup() {
      // there isn't a way to check if suspense is used in the component without accessing a private property
      // @ts-expect-error
      const hasSuspense = Boolean(getCurrentInstance()?.suspense)

      return () => h('span', hasSuspense)
    },
  })
  
  const appWithSuspenseRoot = {
    template: '<Suspense><test-component/></Suspense>',
    components: {
      testComponent,
    },
  }

  const appWithSuspense = mount(appWithSuspenseRoot)

  await flushPromises()

  expect(appWithSuspense.text()).toBe('true')

  const appWithoutSuspenseRoot = {
    template: '<test-component/>',
    components: {
      testComponent,
    },
  }

  const appWithoutSuspense = mount(appWithoutSuspenseRoot)

  expect(appWithoutSuspense.text()).toBe('false')
})

test('renders component with async props using suspense', async () => {
  const { promise, resolve } = Promise.withResolvers<{ value: string }>()
  const fallback = 'Loading...'

  const route = createRoute({
    name: 'home',
    path: '/',
    component: component(echo, () => promise),
  })

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

  const app = mount(root, {
    global: {
      plugins: [router],
    },
  })

  await router.push('home')

  expect(app.text()).toBe(fallback)

  resolve({ value: 'hello world' })

  await flushPromises()

  expect(app.html()).toBe('hello world')
})
