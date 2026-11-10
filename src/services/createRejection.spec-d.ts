import { createRoute, createRouter, createRouterAssets } from '@/main'
import { expectTypeOf, test } from 'vitest'
import { createRejection } from '@/services/createRejection'
import echo from '@/components/echo'
import { RouteView } from '@/types/routeViews'
import { UrlString } from '@/types/urlString'

test('status is optional', () => {
  createRejection({ type: 'Unauthorized', status: 401 })

  createRejection({ name: 'Unauthorized' })
})

test('rejection loaders retain inference and rejection capabilities', () => {
  const denied = createRejection({ name: 'Denied', status: 403 })
    .addLoader((to) => {
      expectTypeOf(to.kind).toEqualTypeOf<'rejection'>()
      expectTypeOf(to.name).toEqualTypeOf<'Denied'>()
      expectTypeOf(to.params).toEqualTypeOf<{}>()
      return 42
    }, { name: 'reason' })
    .setTitle((to) => {
      expectTypeOf(to.loaders.reason.load).returns.toEqualTypeOf<number>()
      expectTypeOf(to.kind).toEqualTypeOf<'rejection'>()
      expectTypeOf(to.name).toEqualTypeOf<'Denied'>()
      return 'Denied'
    })

  expectTypeOf(denied.name).toEqualTypeOf<'Denied'>()
  denied.onBeforeRouteEnter((to, { abort }) => {
    expectTypeOf(to.kind).toEqualTypeOf<'rejection'>()
    expectTypeOf(to.name).toEqualTypeOf<'Denied'>()
    expectTypeOf(abort).toBeFunction()
  })
  // @ts-expect-error rejections do not have URL aliases
  denied.addAlias('/denied')
  // @ts-expect-error rejection definitions cannot declare a path
  createRejection({ name: 'Denied', path: '/denied' })
  // @ts-expect-error rejection definitions do not have parents
  createRejection({ name: 'Denied', parent: createRoute({ path: '/' }) })
})

test('current route and source narrow independently by kind and name', () => {
  const denied = createRejection({ name: 'Denied' }).addLoader(() => 42)
  const users = createRoute({ name: 'users', path: '/users/[id]', context: [denied] })
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([users, home])
  const { useRoute } = createRouterAssets(router)
  const route = useRoute()

  expectTypeOf(route.name).toEqualTypeOf<'users' | 'home' | 'Denied' | 'NotFound'>()
  const rejection = useRoute('Denied')
  expectTypeOf(rejection.kind).toEqualTypeOf<'rejection'>()
  expectTypeOf(rejection.params).toEqualTypeOf<{}>()
  expectTypeOf(rejection.loaders.default.load).returns.toEqualTypeOf<number>()

  if (route.kind === 'rejection' && route.source?.name === 'users') {
    expectTypeOf(route.source.params.id).toEqualTypeOf<string>()
    expectTypeOf(route.source.kind).toEqualTypeOf<'route'>()
    // @ts-expect-error source params do not become rejection params
    expectTypeOf(route.params.id).toBeNever()
  }

  if (route.name === 'users') {
    expectTypeOf(route.kind).toEqualTypeOf<'route'>()
    route.update('id', '42')
    // @ts-expect-error id is a string
    route.update('id', 42)
  }

  router.onBeforeRouteLeave((to) => {
    if (to?.kind === 'rejection' && to.source?.name === 'users') {
      expectTypeOf(to.source.params.id).toEqualTypeOf<string>()
    }
  })

  expectTypeOf(router.reject('Denied')).toEqualTypeOf<Promise<void>>()
  // @ts-expect-error rejection names cannot construct a URL
  router.resolve('Denied')
  // @ts-expect-error rejection names are not named push destinations
  router.push('Denied')
})

test('custom NotFound replaces the built in definition in the route union', () => {
  const notFound = createRejection({ name: 'NotFound' }).addLoader(() => 'missing')
  const router = createRouter([], { rejections: [notFound] })
  expectTypeOf(router.route.name).toEqualTypeOf<'NotFound'>()
  expectTypeOf(router.route.loaders.default.load).returns.toEqualTypeOf<string>()
  expectTypeOf(router.route.source).toEqualTypeOf<null>()
})

test('both naming options preserve literal inference', () => {
  const named = createRejection({ name: 'Denied' })
  const legacy = createRejection({ type: 'Denied' })
  expectTypeOf(named.name).toEqualTypeOf<'Denied'>()
  expectTypeOf(legacy.name).toEqualTypeOf<'Denied'>()
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- The alias keeps its literal type.
  expectTypeOf(named.type).toEqualTypeOf<'Denied'>()
  // @ts-expect-error a rejection still requires a name
  createRejection({ status: 403 })
})

test('rejections have rejection kind', () => {
  const rejection = createRejection({ name: 'Denied' })

  expectTypeOf(rejection.kind).toEqualTypeOf<'rejection'>()
})

test('rejection views retain loader and prop inference through chaining', () => {
  const denied = createRejection({ name: 'Denied', status: 403 })
    .addLoader(() => 42, { name: 'reason' })
    .addView(echo, {
      props: async (to) => {
        expectTypeOf(to.kind).toEqualTypeOf<'rejection'>()
        expectTypeOf(to.name).toEqualTypeOf<'Denied'>()
        expectTypeOf(await to.getData('reason')).toEqualTypeOf<number>()
        return { value: String(await to.getData('reason')) }
      },
    })
    .addView(echo, {
      name: 'sidebar',
      props: (to) => ({ value: to.href }),
    })
    .setTitle(() => 'Denied')

  expectTypeOf(denied.matches[0].views).toEqualTypeOf<{
    default: RouteView<Promise<{ value: string }>>,
    sidebar: RouteView<{ value: UrlString }>,
  }>()
  expectTypeOf(denied.name).toEqualTypeOf<'Denied'>()
  expectTypeOf(denied.onRejection).toBeFunction()
  expectTypeOf(denied.addLoader).toBeFunction()

  // @ts-expect-error required props still require a getter
  createRejection({ name: 'Denied' }).addView(echo)
  createRejection({ name: 'Denied' }).addView(echo, {
    // @ts-expect-error the getter must satisfy the component props
    props: () => ({ value: true }),
  })
})
