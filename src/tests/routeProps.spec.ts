import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createApp, inject } from 'vue'
import { component } from '@/utilities/testHelpers'

test('props are called each time the route is matched', async () => {
  const props = vi.fn()

  const route = createRoute({
    name: 'test',
    path: '/[param]',
  }, props)

  const router = createRouter([route], {
    initialUrl: '/',
  })

  await router.start()

  await router.push('test', { param: 'foo' })

  expect(props).toHaveBeenCalledTimes(1)

  await router.push('test', { param: 'bar' })

  expect(props).toHaveBeenCalledTimes(2)

  await router.push('test', { param: 'foo' })

  expect(props).toHaveBeenCalledTimes(3)
})

test('props are called with the correct context', async () => {
  const props = vi.fn()

  const route = createRoute({
    name: 'route',
    path: '/',
  }, () => {
    const value = inject('global')

    props(value)

    return {}
  })

  const router = createRouter([route], {
    initialUrl: '/',
  })

  const app = createApp(component)

  app.provide('global', 'hello world')
  app.use(router)

  await router.start()

  expect(props).toHaveBeenCalledWith('hello world')
})

test('a props getter is given a signal that aborts when the router navigates away from the route', async () => {
  const seen = Promise.withResolvers<AbortSignal>()
  const home = createRoute({ name: 'home', path: '/' }, (_route, { signal }) => {
    seen.resolve(signal)

    return {}
  })
  const other = createRoute({ name: 'other', path: '/other', component })

  const router = createRouter([home, other], { initialUrl: '/' })

  await router.start()

  const signal = await seen.promise

  expect(signal.aborted).toBe(false)

  await router.push('other')

  expect(signal.aborted).toBe(true)
})
