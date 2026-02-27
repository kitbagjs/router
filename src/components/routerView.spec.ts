import { createSSRApp } from 'vue'
import { describe, it, expect } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { renderToString } from 'vue/server-renderer'

describe('SSR', () => {
  it('should render the route', async () => {
    const route = createRoute({
      name: 'foo',
      path: '/',
      component: { template: 'hello world' },
    })

    const router = createRouter([route], {
      initialUrl: '/',
    })

    const ctx = { foo: 'bar' }

    const app = createSSRApp({
      template: '<RouterView/>',
    })

    app.use(router)

    const html = await renderToString(app, ctx)

    expect(html).toMatchInlineSnapshot('"hello world"')

    expect(ctx).toEqual({ foo: 'bar', title: 'hello world' })
  })
})
