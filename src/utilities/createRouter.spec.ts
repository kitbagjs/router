import { describe, expect, test } from 'vitest'
import { createRouter } from '@/utilities/createRouter'
import { component } from '@/utilities/testHelpers'

describe('createRouter', () => {
  test('initial route is set', () => {
    const root = {
      name: 'root',
      component,
      path: '/',
    }

    const { route } = createRouter([root], {
      initialUrl: root.path,
    })

    expect(route.matched).toMatchObject(root)
  })

  test('throws error if route is not matched', () => {
    expect(() => createRouter([], {
      initialUrl: '/foo',
    })).toThrowError('not implemented')
  })

  test('updates the route when navigating', async () => {
    const first = {
      name: 'first',
      component,
      path: '/first',
    }

    const second = {
      name: 'second',
      component,
      path: '/second',
    }

    const { push, route } = createRouter([first, second], {
      initialUrl: first.path,
    })

    expect(route.matched).toMatchObject(first)

    await push(second.path)

    expect(route.matched).toMatchObject(second)
  })
})