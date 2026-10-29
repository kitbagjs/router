import { createRouterPlugin } from '@/services/createRouterPlugin'
import { createLoader as createDefaultLoader } from '@/main'
import { createRouterAssets } from '@/services/createRouterAssets'
import { createRouter } from '@/services/createRouter'
import { expectTypeOf, test } from 'vitest'
import { createLoader } from '@/services/createLoader'
import { createRoute } from '@/services/createRoute'
import { createRejection } from '@/services/createRejection'
import { Loader } from '@/types/loader'
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

  expectTypeOf(loader).toExtend<Loader<string>>()
  expectTypeOf<WithData<typeof route>['data']>().toEqualTypeOf<Promise<string>>()
  expectTypeOf<WithData<typeof other>['data']>().toEqualTypeOf<{ name: Promise<string> }>()
})

test('declared context types the loader and attached route helpers', () => {
  const settings = createRoute({ name: 'settings', path: '/settings' })
  const login = createRoute({ name: 'login', path: '/login' })
  const denied = createRejection({ type: 'Denied' })
  const loader = createLoader({
    context: [login, denied],
    load: (_route, { push, reject }) => {
      push('login')
      reject('Denied')
      // @ts-expect-error the attached route is not known to the loader
      push('user')
      // @ts-expect-error undeclared rejection
      reject('Other')

      return true
    },
  })
  const route = createRoute({ name: 'user', path: '/', context: [settings] }).addLoader(loader)

  expectTypeOf(loader).toExtend<Loader<boolean, readonly [typeof login, typeof denied]>>()
  route.onBeforeRouteEnter((_to, { push, reject }) => {
    push('settings')
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

test('router assets merge loader context with their routes', () => {
  const user = createRoute({ name: 'user', path: '/users/[id]' })
  const other = createRoute({ name: 'other', path: '/other' })
  const login = createRoute({ name: 'login', path: '/login' })
  const assets = createRouterAssets(createRouter([user]))
  const plugin = createRouterPlugin({ routes: [other] })
  const otherAssets = createRouterAssets(createRouter([], {}, [plugin]))

  assets.createLoader({
    context: [login],
    load: (route, { push }) => {
      expectTypeOf(route.name).toEqualTypeOf<'user' | 'login'>()
      if (route.name === 'user') {
        expectTypeOf(route.params.id).toEqualTypeOf<string>()
      }
      push('login')
      push('user', { id: '1' })
      // @ts-expect-error router route params are still required
      push('user')
    },
  })
  otherAssets.createLoader({
    load: (route) => {
      expectTypeOf(route.name).toEqualTypeOf<'other'>()
    },
  })
})

test('the default loader export works without registration', () => {
  createDefaultLoader({
    load: (route) => {
      expectTypeOf(route.name).toEqualTypeOf<string>()
      expectTypeOf(route.params.id).toBeUnknown()
    },
  })
})
