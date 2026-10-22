import { afterEach, expect, test, vi } from 'vitest'
import { createSSRApp, defineComponent, h, inject, InjectionKey } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createLoader, createRoute, createRouter, useLoader } from '@/main'

afterEach(() => vi.restoreAllMocks())

test('unattached loader data is isolated between SSR apps', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
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
