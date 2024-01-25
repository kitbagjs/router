import { expect, test } from 'vitest'
import { Route } from '@/types'
import { createRouter } from '@/utilities/createRouter'
import { component } from '@/utilities/testHelpers'

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
  } as const satisfies Route

  const second = {
    name: 'second',
    component,
    path: '/second',
  } as const satisfies Route

  const third = {
    name: 'third',
    component,
    path: '/third/:id',
  } as const satisfies Route

  const { push, route } = createRouter([first, second, third], {
    initialUrl: first.path,
  })

  expect(route.matched).toMatchObject(first)

  await push(second.path)

  expect(route.matched).toMatchObject(second)
})