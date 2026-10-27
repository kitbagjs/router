/* eslint-disable vue/one-component-per-file */
import { afterEach, expect, test, vi } from 'vitest'
import { createSSRApp, defineComponent, h, inject, InjectionKey } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createLoader, createRoute, createRouter, RouterSuspense, useLoader } from '@/main'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

test('unattached loader data is isolated between SSR apps', async () => {
  const userKey: InjectionKey<string> = Symbol('user')
  const loader = createLoader({ load: async () => inject(userKey) })
  const route = createRoute({ name: 'home', path: '/' })

  async function render(user: string): Promise<string> {
    const router = createRouter([route], { initialUrl: '/', ssr: true })
    const app = createSSRApp(defineComponent({
      setup: async () => {
        const { data } = await useLoader(loader)

        return () => h('div', String(data.value))
      },
    }))
    app.provide(userKey, user)
    app.use(router)

    try {
      return await renderToString(app)
    } finally {
      router.stop()
    }
  }

  expect(await Promise.all([render('first'), render('second')])).toEqual(['<div>first</div>', '<div>second</div>'])
})

test('server-rendered fallback loaders warn that their data is absent from the payload', async () => {
  vi.stubEnv('NODE_ENV', 'development')
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const loader = createLoader({ load: () => 'loaded' })
  const route = createRoute({ name: 'home', path: '/' })
  const router = createRouter([route], { initialUrl: '/', ssr: true })
  const app = createSSRApp(defineComponent({
    setup: async () => {
      const { data } = await useLoader(loader)

      return () => h('div', data.value)
    },
  }))
  app.use(router)

  try {
    expect(await renderToString(app)).toBe('<div>loaded</div>')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not included in the SSR payload. It will run again on the client.'), loader)
  } finally {
    router.stop()
  }
})

test('forwards server loader failures without leaving rendering pending', async () => {
  const failure = new Error('loader failed')
  const loader = createLoader({
    load: () => Promise.reject<string>(failure),
  })
  const route = createRoute({ name: 'home', path: '/' }).addLoader(loader)
  const router = createRouter([route], { initialUrl: '/', ssr: true })
  await router.start()
  const consumer = defineComponent({
    async setup() {
      await useLoader(loader)
      return () => null
    },
    render: () => null,
  })
  const errorSlot = vi.fn(() => h('p', 'failed'))
  const appErrorHandler = vi.fn()
  const app = createSSRApp({
    render: () => h(RouterSuspense, null, { default: () => h(consumer), error: errorSlot }),
  })
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
