import { expect, test } from 'vitest'
import { createRouter } from '@/utilities/createRouter'
import { path } from '@/utilities/path'
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
  }

  const second = {
    name: 'second',
    component,
    path: '/second',
  }

  const third = {
    name: 'third',
    component,
    path: '/third/:id',
  }

  const { push, route } = createRouter([first, second, third], {
    initialUrl: first.path,
  })

  expect(route.matched).toMatchObject(first)

  await push(second.path)

  expect(route.matched).toMatchObject(second)

  await push({ name: third.name }, { id: ['123'] })

  expect(route.matched).toMatchObject(third)
})