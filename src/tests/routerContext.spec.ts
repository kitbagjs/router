import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { routerContext } from '@/types/routerContext'
import { component } from '@/utilities/testHelpers'

test('a hook receives the context the router was created with', async () => {
  const route = createRoute({
    name: 'route',
    path: '/',
    component,
    routerContext: routerContext<{ session: { userId: string } }>(),
  })

  const hook = vi.fn()
  route.onBeforeRouteEnter((_to, { context }) => hook(context))

  const router = createRouter([route], {
    initialUrl: '/',
    context: { session: { userId: 'kitbag' } },
  })

  await router.start()

  expect(hook).toHaveBeenCalledWith({ session: { userId: 'kitbag' } })
})

test('a loader receives the context the router was created with', async () => {
  const route = createRoute({
    name: 'route',
    path: '/',
    component,
    routerContext: routerContext<{ session: { userId: string } }>(),
  }).addLoader(async (_route, { context }) => context.session.userId)

  const router = createRouter([route], {
    initialUrl: '/',
    context: { session: { userId: 'kitbag' } },
  })

  await router.start()

  await expect(router.route.data).resolves.toBe('kitbag')
})

test('a router created without context gives callbacks an empty context', async () => {
  const route = createRoute({ name: 'route', path: '/', component })

  const hook = vi.fn()
  route.onBeforeRouteEnter((_to, { context }) => hook(context))

  const router = createRouter([route], { initialUrl: '/' })

  await router.start()

  expect(hook).toHaveBeenCalledWith({})
})

test('the router exposes the context it was created with', () => {
  const context = { session: { userId: 'kitbag' } }

  const route = createRoute({
    name: 'route',
    path: '/',
    component,
    routerContext: routerContext<{ session: { userId: string } }>(),
  })

  const router = createRouter([route], { initialUrl: '/', context })

  expect(router.context).toBe(context)
})
