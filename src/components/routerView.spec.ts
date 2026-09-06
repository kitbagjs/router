/* eslint-disable vue/one-component-per-file */
import { createSSRApp, defineComponent, h } from 'vue'
import { describe, it, expect } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { renderToString } from 'vue/server-renderer'

const sleep = (ms: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

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

    const app = createSSRApp({
      template: '<RouterView/>',
    })

    app.use(router)

    const html = await renderToString(app)

    expect(html).toMatchInlineSnapshot('"hello world"')
  })

  it('renders pending async props without Suspense and without render', async () => {
    const view = defineComponent({
      props: { name: { type: String, required: true } },
      setup: (props) => () => h('div', `hello ${props.name}`),
    })

    const route = createRoute({ name: 'user', path: '/' })
      .addView(view, {
        props: async () => {
          await sleep(20)

          return { name: 'craig' }
        },
      })

    const router = createRouter([route], { initialUrl: '/' })

    const app = createSSRApp({
      template: '<RouterView/>',
    })

    app.use(router)

    await router.start()

    const html = await renderToString(app)

    expect(html).toBe('<div>hello craig</div>')
  })

  it('renders pending loader data without Suspense and without render', async () => {
    const view = defineComponent({
      props: { name: { type: String, required: true } },
      setup: (props) => () => h('div', `loaded ${props.name}`),
    })

    const route = createRoute({ name: 'user', path: '/' })
      .addLoader(async () => {
        await sleep(20)

        return 'craig'
      })
      .addView(view, { props: async (route) => ({ name: await route.data }) })

    const router = createRouter([route], { initialUrl: '/' })

    const app = createSSRApp({
      template: '<RouterView/>',
    })

    app.use(router)

    await router.start()

    const html = await renderToString(app)

    expect(html).toBe('<div>loaded craig</div>')
  })
})
