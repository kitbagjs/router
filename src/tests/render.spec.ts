import { flushPromises } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'

const sleep = (ms: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

describe('router.render', () => {
  test('waits for a loader to settle', async () => {
    const { promise, resolve } = Promise.withResolvers<string>()
    const route = createRoute({ name: 'route', path: '/', component }).addLoader(() => promise)
    const router = createRouter([route], { initialUrl: '/' })

    await router.start()

    let rendered = false

    const rendering = router.render().then(() => {
      rendered = true
    })

    await flushPromises()

    expect(rendered).toBe(false)

    resolve('loaded')
    await rendering

    expect(rendered).toBe(true)
    await expect(router.route.data).resolves.toBe('loaded')
  })

  test('waits for props to settle', async () => {
    const { promise, resolve } = Promise.withResolvers<string>()
    const props = vi.fn(async () => ({ value: await promise }))
    const route = createRoute({ name: 'route', path: '/' }).addView(component, { props })
    const router = createRouter([route], { initialUrl: '/' })

    await router.start()

    let rendered = false

    const rendering = router.render().then(() => {
      rendered = true
    })

    await flushPromises()

    expect(rendered).toBe(false)

    resolve('props')
    await rendering

    expect(rendered).toBe(true)
    expect(props).toHaveBeenCalled()
  })

  test('start does not wait for a loader', async () => {
    const { promise, resolve } = Promise.withResolvers<string>()
    const route = createRoute({ name: 'route', path: '/', component }).addLoader(() => promise)
    const router = createRouter([route], { initialUrl: '/' })

    await router.start()

    expect(router.route.name).toBe('route')

    resolve('late')
  })

  test('resolves immediately when there is nothing left to render', async () => {
    const route = createRoute({ name: 'route', path: '/', component })
    const router = createRouter([route], { initialUrl: '/' })

    await router.start()

    await expect(router.render()).resolves.toMatchObject({ status: 200, rejection: null })
  })

  test('after a push, waits for the new route data', async () => {
    const { promise, resolve } = Promise.withResolvers<string>()
    const other = createRoute({ name: 'other', path: '/other', component }).addLoader(() => promise)
    const home = createRoute({ name: 'home', path: '/', component })
    const router = createRouter([home, other], { initialUrl: '/' })

    await router.start()
    await router.push('other')

    let rendered = false

    const rendering = router.render().then(() => {
      rendered = true
    })

    await flushPromises()

    expect(rendered).toBe(false)

    resolve('loaded')
    await rendering

    expect(rendered).toBe(true)
    await expect(router.route.data).resolves.toBe('loaded')
  })

  test('given a loader that rejects the navigation, reports the rejection status', async () => {
    const route = createRoute({ name: 'route', path: '/', component })
      .addLoader(async (_route, { reject }) => {
        await Promise.resolve()
        reject('NotFound')
      })

    const router = createRouter([route], { initialUrl: '/' })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ status: 404, rejection: 'NotFound' })
  })

  test('waits for work a cascading navigation registers after the first drain', async () => {
    const first = Promise.withResolvers<string>()
    const second = Promise.withResolvers<string>()

    const other = createRoute({ name: 'other', path: '/other', component })
      .addLoader(() => second.promise)

    const route = createRoute({ name: 'route', path: '/', component, context: [other] })
      .addLoader(async (_route, { push }) => {
        await first.promise
        push('other')
      })

    const router = createRouter([route, other], { initialUrl: '/' })

    await router.start()

    let rendered = false

    const rendering = router.render().then(() => {
      rendered = true
    })

    first.resolve('one')
    await flushPromises()

    expect(rendered).toBe(false)

    second.resolve('two')
    await rendering

    expect(rendered).toBe(true)
    expect(router.route.name).toBe('other')
  })

  test('given a props getter that pushes, reports the redirect before anything renders', async () => {
    const other = createRoute({ name: 'other', path: '/other' })
      .addView(component, { props: () => ({ value: 'other' }) })

    const route = createRoute({ name: 'route', path: '/', context: [other] })
      .addView(component, {
        props: async (_route, { push }) => {
          await Promise.resolve()
          push('other')

          return { value: 'route' }
        },
      })

    const router = createRouter([route, other], { initialUrl: '/' })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ status: 302, location: '/other' })
    expect(router.route.name).toBe('other')
  })

  test('waits for a cascading navigation that registers its data behind a slow hook', async () => {
    const other = createRoute({ name: 'other', path: '/other', component })
      .addLoader(async () => {
        await sleep(20)

        return 'other-data'
      })

    other.onBeforeRouteEnter(async () => {
      await sleep(20)
    })

    const route = createRoute({ name: 'route', path: '/', component, context: [other] })
      .addLoader((_route, { push }) => push('other'))

    const router = createRouter([route, other], { initialUrl: '/' })

    await router.start()

    const response = await router.render()

    expect(response.status).toBe(302)
    expect(router.route.name).toBe('other')
    await expect(router.route.data).resolves.toBe('other-data')
  })

  test('given a loader that pushes, waits for the navigation it caused', async () => {
    const other = createRoute({ name: 'other', path: '/other', component })
    const route = createRoute({ name: 'route', path: '/', component, context: [other] })
      .addLoader((_route, { push }) => push('other'))

    const router = createRouter([route, other], { initialUrl: '/' })

    await router.start()

    const result = await router.render()

    expect(router.route.name).toBe('other')
    expect(result.status).toBe(302)
  })
})
