import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { routerContext } from '@/types/routerContext'
import { component } from '@/utilities/testHelpers'

type Session = { userId: string }

test('a route declares the context it requires, and its callbacks receive it typed', () => {
  const route = createRoute({
    name: 'user',
    path: '/user/[id]',
    routerContext: routerContext<{ session: Session }>(),
  })

  route.addLoader((_route, { context }) => {
    expectTypeOf(context.session).toEqualTypeOf<Session>()

    return context.session.userId
  })

  route.addView(component, {
    props: (_route, { context }) => {
      expectTypeOf(context.session).toEqualTypeOf<Session>()

      return {}
    },
  })

  route.onBeforeRouteEnter((_to, { context }) => {
    expectTypeOf(context.session).toEqualTypeOf<Session>()
  })
})

test('a child inherits its parent requirement and can add its own', () => {
  const parent = createRoute({
    name: 'parent',
    path: '/parent',
    routerContext: routerContext<{ session: Session }>(),
  })

  const child = createRoute({
    parent,
    name: 'child',
    path: '/child',
    routerContext: routerContext<{ flags: string[] }>(),
  })

  child.addLoader((_route, { context }) => {
    expectTypeOf(context.session).toEqualTypeOf<Session>()
    expectTypeOf(context.flags).toEqualTypeOf<string[]>()

    return null
  })
})

test('the router requires the combined context of every route', () => {
  const user = createRoute({
    name: 'user',
    path: '/user',
    routerContext: routerContext<{ session: Session }>(),
  })

  const flagged = createRoute({
    name: 'flagged',
    path: '/flagged',
    routerContext: routerContext<{ flags: string[] }>(),
  })

  createRouter([user, flagged], {
    initialUrl: '/user',
    context: { session: { userId: '1' }, flags: [] },
  })

  createRouter([user, flagged], {
    initialUrl: '/user',
    // @ts-expect-error the context is missing what `flagged` requires
    context: { session: { userId: '1' } },
  })

  // @ts-expect-error a router over routes that require context cannot be created without it
  createRouter([user, flagged], { initialUrl: '/user' })
})

test('routes that require nothing keep context optional', () => {
  const route = createRoute({ name: 'route', path: '/', component })

  createRouter([route], { initialUrl: '/' })
  createRouter([route], { initialUrl: '/', context: { anything: true } })
})

test('the router exposes the context it was created with', () => {
  const route = createRoute({
    name: 'route',
    path: '/',
    routerContext: routerContext<{ session: Session }>(),
  })

  const context: { session: Session } = { session: { userId: '1' } }

  const router = createRouter([route], { initialUrl: '/', context })

  expectTypeOf(router.context.session).toEqualTypeOf<Session>()
})
