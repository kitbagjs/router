import { expect, test, vi } from 'vitest'
import { createRoute } from './services/createRoute'
import { createRouter } from './services/createRouter'

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
