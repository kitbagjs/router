import { expect, test, vi } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createLoader, createRoute, createRouter, createRouterAssets, useLoader } from '@/main'

test.each([true, false])('fallback loads are isolated across SSR apps (global router: %s)', async (isGlobalRouter) => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const load = vi.fn(async (route) => route.params.id)
  const loader = createLoader({ load })
  const route = createRoute({ name: 'user', path: '/[id]' })

  async function render(id: string): Promise<string> {
    const router = createRouter([route], { initialUrl: `/${id}`, isGlobalRouter, ssr: true })
    const assets = createRouterAssets(router)
    const readLoader = isGlobalRouter ? useLoader : assets.useLoader
    const app = createSSRApp(defineComponent({
      async setup() {
        const first = readLoader(loader)
        const second = readLoader(loader)
        const data = await first
        expect(await second).toBe(data)
        return () => h('div', data)
      },
    }))
    app.use(router)
    await router.start()

    try {
      return await renderToString(app)
    } finally {
      router.stop()
    }
  }

  expect(await Promise.all([render('1'), render('2')])).toEqual(['<div>1</div>', '<div>2</div>'])
  expect(load).toHaveBeenCalledTimes(2)
  expect(warn).toHaveBeenCalledTimes(2)
  warn.mockRestore()
})
