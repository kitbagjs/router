import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { defineAsyncComponent, defineComponent, h, onMounted, ref } from 'vue'
import { createRouteCommit } from '@/services/createRouteCommit'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRouteValueStore } from '@/services/createRouteValueStore'

test('prepares props, loaders, and lazy components without replacing the rendered store', async () => {
  const valueStore = createRouteValueStore()
  const previous = createResolvedRoute(createRoute({ name: 'previous', path: '/' }).addLoader(() => 'previous'))
  await valueStore.commit(previous).loaders

  const props = Promise.withResolvers<{ value: string }>()
  const loader = Promise.withResolvers<string>()
  const component = Promise.withResolvers<ReturnType<typeof defineComponent>>()
  const getProps = vi.fn(() => props.promise)
  const getLoader = vi.fn(() => loader.promise)
  const getComponent = vi.fn(() => component.promise)
  const route = createResolvedRoute(createRoute({ name: 'next', path: '/next' })
    .addLoader(getLoader)
    .addView(defineAsyncComponent(getComponent), { props: getProps }))
  const update = vi.fn(() => valueStore.commit(route))
  const operation = createRouteCommit({ route, valueStore, signal: new AbortController().signal, update })
  let settled = false
  const preparation = operation.prepare().then((result) => {
    settled = true
    return result
  })

  expect(getProps).toHaveBeenCalledOnce()
  expect(getLoader).toHaveBeenCalledOnce()
  expect(getComponent).toHaveBeenCalledOnce()
  expect(await valueStore.getData(previous)).toBe('previous')
  expect(update).not.toHaveBeenCalled()

  props.resolve({ value: 'ready' })
  loader.resolve('ready')
  await Promise.resolve()
  expect(settled).toBe(false)
  component.resolve(defineComponent(() => () => h('div', 'ready')))

  expect(await preparation).toMatchObject({
    props: { status: 'fulfilled', value: { status: 'SUCCESS' } },
    loaders: { status: 'fulfilled', value: { status: 'SUCCESS' } },
    components: [{ status: 'fulfilled' }],
  })
  expect(await operation.commit()).toBe(true)
  expect(await valueStore.getData(route)).toBe('ready')
  expect(getProps).toHaveBeenCalledOnce()
  expect(getLoader).toHaveBeenCalledOnce()
})

test.each(['PUSH', 'REJECT', 'ERROR'] as const)('preparation preserves a loader %s outcome for the caller', async (outcome) => {
  const error = new Error('loader failed')
  const route = createResolvedRoute(createRoute({ name: 'next', path: '/next' }).addLoader((_route, { push, reject }) => {
    if (outcome === 'PUSH') push('/elsewhere')
    if (outcome === 'REJECT') reject('NotFound')
    throw error
  }))
  const valueStore = createRouteValueStore()
  const update = vi.fn()
  const operation = createRouteCommit({ route, valueStore, signal: new AbortController().signal, update })
  const result = await operation.prepare()

  if (outcome === 'ERROR') {
    expect(result?.loaders).toEqual({ status: 'rejected', reason: error })
  } else {
    expect(result?.loaders).toMatchObject({ status: 'fulfilled', value: { status: outcome } })
  }

  expect(update).not.toHaveBeenCalled()
  expect(await operation.commit()).toBe(true)
})

test('abandoning a preparation releases the caller even when its loader never settles', async () => {
  const route = createResolvedRoute(createRoute({ name: 'next', path: '/next' }).addLoader(() => new Promise(() => {})))
  const controller = new AbortController()
  const update = vi.fn()
  const operation = createRouteCommit({ route, valueStore: createRouteValueStore(), signal: controller.signal, update })
  const preparation = operation.prepare()

  controller.abort()

  expect(await preparation).toBeUndefined()
  expect(await operation.commit()).toBe(false)
  expect(update).not.toHaveBeenCalled()
})

test('an already abandoned navigation neither prepares nor commits', async () => {
  const getter = vi.fn()
  const route = createResolvedRoute(createRoute({ name: 'next', path: '/next' }).addLoader(getter))
  const controller = new AbortController()
  const update = vi.fn()
  controller.abort()
  const operation = createRouteCommit({ route, valueStore: createRouteValueStore(), signal: controller.signal, update })

  expect(await operation.prepare()).toBeUndefined()
  expect(await operation.commit()).toBe(false)
  expect(getter).not.toHaveBeenCalled()
  expect(update).not.toHaveBeenCalled()
})

test('a getter can synchronously abandon preparation', async () => {
  const controller = new AbortController()
  const route = createResolvedRoute(createRoute({ name: 'next', path: '/next' }).addLoader(() => {
    controller.abort()
    return new Promise(() => {})
  }))
  const update = vi.fn()
  const operation = createRouteCommit({ route, valueStore: createRouteValueStore(), signal: controller.signal, update })

  expect(await operation.prepare()).toBeUndefined()
  expect(await operation.commit()).toBe(false)
  expect(update).not.toHaveBeenCalled()
})

test('commit resolves after the DOM updates without waiting for pending route data', async () => {
  const current = ref('previous')
  const wrapper = mount(defineComponent(() => () => h('div', current.value)))
  const route = createResolvedRoute(createRoute({ name: 'next', path: '/next' }).addLoader(() => new Promise(() => {})))
  const valueStore = createRouteValueStore()
  const operation = createRouteCommit({
    route,
    valueStore,
    signal: new AbortController().signal,
    update: () => {
      valueStore.commit(route)
      current.value = 'next'
    },
  })

  expect(await operation.commit()).toBe(true)
  expect(wrapper.text()).toBe('next')
  wrapper.unmount()
})

test('a navigation abandoned during mounting does not report a successful commit', async () => {
  const controller = new AbortController()
  const show = ref(false)
  const destination = defineComponent(() => {
    onMounted(() => controller.abort())
    return () => h('div', 'next')
  })
  const wrapper = mount(defineComponent(() => () => {
    return show.value ? h(destination) : null
  }))
  const operation = createRouteCommit({
    route: null,
    valueStore: createRouteValueStore(),
    signal: controller.signal,
    update: () => {
      show.value = true
    },
  })

  expect(await operation.commit()).toBe(false)
  expect(wrapper.text()).toBe('next')
  wrapper.unmount()
})

test('a failed commit reaches the caller before it can start after hooks', () => {
  const error = new Error('commit failed')
  const operation = createRouteCommit({
    route: null,
    valueStore: createRouteValueStore(),
    signal: new AbortController().signal,
    update: () => {
      throw error
    },
  })

  expect(() => operation.commit()).toThrow(error)
})
