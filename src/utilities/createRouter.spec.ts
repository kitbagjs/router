import { expect, test } from 'vitest'
import { Route } from '@/types'
import { createRouter } from '@/utilities/createRouter'
import { component } from '@/utilities/testHelpers'

test('initial route is set', async () => {
  const root = {
    name: 'root',
    component,
    path: '/',
  }

  const { route, initialized } = createRouter([root], {
    initialUrl: root.path,
  })

  await initialized

  expect(route.matched.name).toBe(root.name)
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

  const { push, route, initialized } = createRouter([first, second, third], {
    initialUrl: first.path,
  })

  await initialized

  expect(route.matched.name).toBe(first.name)

  await push(second.path)

  expect(route.matched).toMatchObject(second)
})