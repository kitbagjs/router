/* eslint-disable vue/one-component-per-file */
import { afterEach, expect, test, vi } from 'vitest'
import { createSSRApp, defineComponent, h, inject, InjectionKey } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createLoader, createRoute, createRouter, useLoader } from '@/main'
import { warnLoaderFallback } from '@/services/warnLoaderFallback'

vi.mock('@/services/warnLoaderFallback', () => ({ warnLoaderFallback: vi.fn() }))

afterEach(() => {
  vi.clearAllMocks()
})

test('keeps fallback data isolated between server requests', async () => {
  const userKey: InjectionKey<string> = Symbol('user')
  const loader = createLoader({ load: () => inject(userKey) })
  const route = createRoute({ name: 'home', path: '/' })

  async function render(user: string): Promise<string> {
    const router = createRouter([route], { initialUrl: '/', ssr: true })
    const app = createSSRApp(defineComponent({
      setup: () => {
        const { data } = useLoader(loader)

        return () => h('div', String(data.value))
      },
    }))
    app.provide(userKey, user)
    app.use(router)

    try {
      await router.start()
      return await renderToString(app)
    } finally {
      router.stop()
    }
  }

  expect(await Promise.all([render('first'), render('second')])).toEqual(['<div>first</div>', '<div>second</div>'])
})

test('warns when a fallback loader runs during server rendering', async () => {
  const loader = createLoader({ load: () => 'loaded' })
  const route = createRoute({ name: 'home', path: '/' })
  const router = createRouter([route], { initialUrl: '/', ssr: true })
  const app = createSSRApp(defineComponent({
    setup: () => {
      const { data } = useLoader(loader)

      return () => h('div', data.value)
    },
  }))
  app.use(router)

  try {
    await router.start()
    expect(await renderToString(app)).toBe('<div>loaded</div>')
    expect(warnLoaderFallback).toHaveBeenCalledExactlyOnceWith({
      loader,
      route: expect.objectContaining({ name: 'home', href: '/' }),
      fallback: { reason: 'missing' },
      isServerRendering: true,
    })
  } finally {
    router.stop()
  }
})
