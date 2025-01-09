import { expectTypeOf, test } from 'vitest'
// import { Hash } from '@/types/hash'
// import { Host } from '@/types/host'
// import { Path } from '@/types/path'
// import { Query } from '@/types/query'
// import { CreatedRouteOptions, Route } from '@/types/route'
// import { RouteGetByKey } from '@/types/routeWithParams'
// import { routes } from '@/utilities/testHelpers'
// import { RouteMeta } from '@/types/register'
// import { Param } from '@/types/paramTypes'
import { createRoute } from '@/main'
import echo from '@/components/echo'

// test('RouteGetByName works as expected', () => {
//   type Source = RouteGetByKey<typeof routes, 'parentA'>
//   type Matched = CreatedRouteOptions & {
//     readonly name: 'parentA',
//     readonly path: '/parentA/[paramA]',
//   }
//   type Expect = Route<'parentA', Host<'', {}>, Path<'/parentA/[paramA]', {}>, Query<'', {}>, Hash<''>, RouteMeta, Record<string, Param>, [Matched]>
//   expectTypeOf<Source['path']>().toEqualTypeOf<Expect['path']>()

//   expectTypeOf<Source>().toEqualTypeOf<Expect>()
// })

test('prop type is preserved', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const route = createRoute({
    path: '/parentA/[paramA]',
    component: echo,
    props() {
      return { value: 'test', hello: 'world' }
    },
  })

  type Matched = typeof route.matched
  type Props = Matched['props']

  type Expected = {
    value: string,
    hello: string,
  }

  expectTypeOf<ReturnType<Props>>().toEqualTypeOf<Expected>()
})
