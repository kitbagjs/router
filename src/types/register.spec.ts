import { expectTypeOf, test } from 'vitest'
import { createRouter } from '@/services/createRouter'
import { component, routes } from '@/utilities'
import { RegisteredRejectionType, RegisteredRoutes, RouteMeta } from './register'

test('given routes, RegisteredRoutes is correct', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = createRouter(routes, { initialUrl: '/' })

  type Routes = RegisteredRoutes<{ router: typeof router }>

  expectTypeOf<Routes>().toMatchTypeOf<typeof routes>()
})

test('given rejections in router options, RegisteredRejectionType is correct', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = createRouter([], {
    initialUrl: '/',
    rejections: {
      AuthNeeded: component,
    },
  })

  type Rejections = RegisteredRejectionType<{ router: typeof router }>

  expectTypeOf<Rejections>().toMatchTypeOf<'AuthNeeded' | 'NotFound'>()
})

test('given route meta in router options, RouteMeta is correct', () => {
  type Meta = RouteMeta<{ routeMeta: { zoo: number } }>

  expectTypeOf<Meta>().toMatchTypeOf<{ zoo: number }>()
})
