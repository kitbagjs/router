import { expect, test } from 'vitest'
import { useRouter } from '@/compositions'
import { createRouter } from '@/utilities/createRouter'
import { createRoutes } from '@/utilities/createRouterRoutes'
import { component } from '@/utilities/testHelpers'

test('initial route is set', async () => {
  const routes = createRoutes([
    {
      name: 'root',
      component,
      path: '/',
    },
  ])

  // const router = createRouter(routes, {
  //   initialUrl: '/',
  // })

  const router = useRouter()

  router.push({ route: 'test' })

  // await initialized

  // expect(route.matched.name).toBe('root')
})

test('updates the route when navigating', async () => {
  const routes = createRoutes([
    {
      name: 'first',
      component,
      path: '/first',
    },
    {
      name: 'second',
      component,
      path: '/second',
    },
    {
      name: 'third',
      component,
      path: '/third/:id',
    },
  ])

  const { push, route, initialized } = createRouter(routes, {
    initialUrl: '/first',
  })

  await initialized

  expect(route.matched.name).toBe('first')

  await push('/second')

  expect(route.matched.name).toBe('second')
})