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
