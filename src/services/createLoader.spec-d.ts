import { expectTypeOf, test } from 'vitest'
import { createLoader } from '@/services/createLoader'
import { createRoute } from '@/services/createRoute'
import { createRejection } from '@/services/createRejection'
import { createRouter } from '@/services/createRouter'
import { LoaderRoute } from '@/types/loader'
import { ResolvedRoute, WithData } from '@/types/resolved'

test('loaders receive resolved routes and preserve their data type', () => {
  const loader = createLoader({
    load: (route) => {
      expectTypeOf(route).toEqualTypeOf<ResolvedRoute>()
      // @ts-expect-error loaders cannot read their own data
      expectTypeOf(route.data)

      return route.name
    },
  })
  const route = createRoute({ name: 'user', path: '/users/[id]' }).addLoader(loader)
  const other = createRoute({ name: 'post', path: '/posts' }).addLoader(loader, { name: 'name' })

  expectTypeOf<WithData<typeof route>['data']>().toEqualTypeOf<Promise<string>>()
  expectTypeOf<WithData<typeof other>['data']>().toEqualTypeOf<{ name: Promise<string> }>()
})

test('registered routes form a discriminated union', () => {
  const user = createRoute({ name: 'user', path: '/users/[id]' })
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([user, home])

  type RegisteredRoute = LoaderRoute<{ router: typeof router }>

  expectTypeOf<Extract<RegisteredRoute, { name: 'user' }>['params']>().toEqualTypeOf<{ id: string }>()
  expectTypeOf<Extract<RegisteredRoute, { name: 'home' }>['params']>().toEqualTypeOf<{}>()
})

test('declared context types the loader and attached route helpers', () => {
  const login = createRoute({ name: 'login', path: '/login' })
  const denied = createRejection({ type: 'Denied' })
  const loader = createLoader({
    context: [login, denied],
    load: (_params, { push, reject }) => {
      push('login')
      reject('Denied')
      // @ts-expect-error the attached route is not known to the loader
      push('user')
      // @ts-expect-error undeclared rejection
      reject('Other')

      return true
    },
  })
  const route = createRoute({ name: 'user', path: '/' }).addLoader(loader)

  route.onBeforeRouteEnter((_to, { push, reject }) => {
    push('login')
    reject('Denied')
    // @ts-expect-error attaching a loader must not widen the route's context
    push('unrelated')
  })
})

test('async data types the transformer without widening from it', () => {
  const loader = createLoader({
    load: async () => new Date(),
    transformer: {
      stringify: (value) => {
        expectTypeOf(value).toEqualTypeOf<Date>()

        return value.toISOString()
      },
      parse: (encoded) => new Date(encoded),
    },
  })
  const route = createRoute({ path: '/' }).addLoader(loader)

  expectTypeOf<WithData<typeof route>['data']>().toEqualTypeOf<Promise<Date>>()
  createLoader({
    load: async () => new Date(),
    transformer: {
      stringify: (value) => value.toISOString(),
      // @ts-expect-error the transformer must restore the loader's resolved value
      parse: (encoded) => encoded,
    },
  })
})
