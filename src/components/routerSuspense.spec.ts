/* eslint-disable vue/one-component-per-file */
import { expect, test, vi } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRoute, createRouter, RouterSuspense } from '@/main'

test('renders content after async setup resolves on the server', async () => {
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
    expect(await renderToString(app)).toBe('<!--[--><p>ready</p><!--]-->')
  } finally {
    router.stop()
  }
})

test('forwards server errors to the app error handler even when catch is enabled', async () => {
  const failure = new Error('failed')
  const child = defineComponent({
    async setup() {
      throw failure
    },
    render: () => null,
  })
  const router = createRouter([createRoute({ name: 'home', path: '/' })], { initialUrl: '/', ssr: true })
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const app = createSSRApp({ render: () => h(RouterSuspense, { catch: true }, { default: () => h(child), error: errorSlot }) })
  const appErrorHandler = vi.fn()
  app.config.errorHandler = appErrorHandler
  app.use(router)

  try {
    await renderToString(app)
    expect(appErrorHandler).toHaveBeenCalledTimes(1)
    expect(appErrorHandler.mock.calls[0][0]).toBe(failure)
    expect(errorSlot).not.toHaveBeenCalled()
  } finally {
    router.stop()
  }
})
