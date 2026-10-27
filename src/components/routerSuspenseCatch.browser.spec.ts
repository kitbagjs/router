/* eslint-disable vue/one-component-per-file */
import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createRoute, createRouter, RouterSuspense } from '@/main'

test('forwards component errors to the app error handler by default', async () => {
  const failure = new Error('click failed')
  const child = defineComponent({
    setup: () => () => h('button', {
      onClick: () => {
        throw failure
      },
    }, 'ready'),
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const appErrorHandler = vi.fn()
  const wrapper = mount(RouterSuspense, {
    slots: { default: () => h(child), error: errorSlot },
    global: { plugins: [router], config: { errorHandler: appErrorHandler } },
  })

  await wrapper.get('button').trigger('click')
  expect(wrapper.text()).toBe('ready')
  expect(errorSlot).not.toHaveBeenCalled()
  expect(appErrorHandler).toHaveBeenCalledTimes(1)
  expect(appErrorHandler.mock.calls[0][0]).toBe(failure)
})

test.each([
  { name: 'renders matching component errors in the error slot', accepts: true },
  { name: 'forwards unmatched component errors to the app error handler', accepts: false },
])('$name', async ({ accepts }) => {
  const failure = new Error('click failed')
  const predicate = vi.fn((error: unknown) => accepts && error === failure)
  const child = defineComponent({
    setup: () => () => h('button', {
      onClick: () => {
        throw failure
      },
    }, 'ready'),
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/' })
  await router.start()
  const appErrorHandler = vi.fn()
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const wrapper = mount(RouterSuspense, {
    props: { catch: predicate },
    slots: { default: () => h(child), error: errorSlot },
    global: { plugins: [router], config: { errorHandler: appErrorHandler } },
  })

  await wrapper.get('button').trigger('click')
  expect(predicate).toHaveBeenCalledExactlyOnceWith(failure)
  expect(wrapper.text()).toBe(accepts ? 'failed' : 'ready')
  expect(appErrorHandler).toHaveBeenCalledTimes(accepts ? 0 : 1)
})
