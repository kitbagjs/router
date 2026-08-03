/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { defineComponent, h, ref, watch } from 'vue'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { useRoute } from '@/main'

/**
 * A view that renders whatever the route's data resolves to, and 'loading' until it does.
 */
const dataView = defineComponent({
  setup() {
    const route = useRoute()
    const data = ref<string>()

    watch(() => route.data as Promise<string>, async (loading) => {
      data.value = await loading
    }, { immediate: true })

    return () => h('div', {}, data.value ?? 'loading')
  },
})

test('a component renders before its loader settles', async () => {
  const { promise, resolve } = Promise.withResolvers<string>()

  const route = createRoute({ name: 'route', path: '/' })
    .addView(dataView)
    .addLoader(() => promise)

  const router = createRouter([route], { initialUrl: '/' })
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })

  await router.start()
  await flushPromises()

  expect(wrapper.text()).toBe('loading')

  resolve('kitbag')
  await flushPromises()

  expect(wrapper.text()).toBe('kitbag')
})

test('data is a new promise for each navigation', async () => {
  const route = createRoute({ name: 'route', path: '/[id]' })
    .addView(dataView)
    .addLoader(async (route) => `user-${route.params.id}`)

  const router = createRouter([route], { initialUrl: '/1' })
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })

  await router.start()
  await flushPromises()

  expect(wrapper.text()).toBe('user-1')

  await router.push('route', { id: '2' })
  await flushPromises()

  expect(wrapper.text()).toBe('user-2')
})

test('a component can await data in setup under suspense', async () => {
  const { promise, resolve } = Promise.withResolvers<string>()

  const suspendingView = defineComponent({
    async setup() {
      const route = useRoute()
      const data = await (route.data as Promise<string>)

      return () => h('div', {}, data)
    },
  })

  const route = createRoute({ name: 'route', path: '/' })
    .addView(suspendingView)
    .addLoader(() => promise)

  const router = createRouter([route], { initialUrl: '/' })
  const wrapper = mount({ template: '<Suspense><RouterView /></Suspense>' }, { global: { plugins: [router] } })

  await router.start()
  await flushPromises()

  expect(wrapper.text()).toBe('')

  resolve('kitbag')
  await flushPromises()

  expect(wrapper.text()).toBe('kitbag')
})

test('a view renders with its props while a loader is still running', async () => {
  const { promise, resolve } = Promise.withResolvers<string>()

  const view = defineComponent({
    props: {
      value: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const route = useRoute()
      const data = ref<string>()

      watch(() => route.data as Promise<string>, async (loading) => {
        data.value = await loading
      }, { immediate: true })

      return () => h('div', {}, `${props.value}:${data.value ?? 'loading'}`)
    },
  })

  const route = createRoute({ name: 'route', path: '/' })
    .addView(view, { props: () => ({ value: 'props' }) })
    .addLoader(() => promise)

  const router = createRouter([route], { initialUrl: '/' })
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })

  await router.start()
  await flushPromises()

  expect(wrapper.text()).toBe('props:loading')

  resolve('data')
  await flushPromises()

  expect(wrapper.text()).toBe('props:data')
})
