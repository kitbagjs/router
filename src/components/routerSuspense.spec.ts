/* eslint-disable vue/one-component-per-file */
import { expect, test, vi } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRoute, createRouter, RouterSuspense } from '@/main'

test('server rendering waits for async content', async () => {
  const child = defineComponent({
    async setup() {
      await Promise.resolve()
      return () => h('p', 'ready')
    },
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/', ssr: true })
  const app = createSSRApp({ render: () => h(RouterSuspense, null, { default: () => h(child) }) })
  app.use(router)

  try {
    expect(await renderToString(app)).toBe('<p>ready</p>')
  } finally {
    router.stop()
  }
})

test('server errors reach the app error handler instead of being swallowed by the boundary', async () => {
  const failure = new Error('failed')
  const child = defineComponent({
    async setup() {
      await Promise.resolve()
      throw failure
    },
    render: () => null,
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/', ssr: true })
  const errorSlot = vi.fn(() => h('p', 'client error'))
  const app = createSSRApp({ render: () => h(RouterSuspense, null, { default: () => h(child), error: errorSlot }) })
  const onError = vi.fn()
  app.config.errorHandler = onError
  app.use(router)

  try {
    await renderToString(app)
    expect(onError.mock.calls[0][0]).toBe(failure)
    expect(errorSlot).not.toHaveBeenCalled()
  } finally {
    router.stop()
  }
})
