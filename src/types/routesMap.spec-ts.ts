import { expectTypeOf, test } from 'vitest'
import { createRoutes } from '@/services'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { RegisteredRouteMap } from '@/types/register'
import { Route } from '@/types/route'
import { RoutesMap } from '@/types/routesMap'
import { component } from '@/utilities/testHelpers'

test('RoutesMap given generic routes, returns generic string', () => {
  type Routes = Route<string, '', Path<'', {}>, Query<'', {}>, false>[]

  type Source = RegisteredRouteMap[keyof RegisteredRouteMap]['key']
  type Expect = 'foo' | 'foo.zoo' | 'zoo'

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('RoutesMap given unnamed parents, removes them from return value and children keys', () => {
  const routes = createRoutes([
    {
      path: '/',
      children: createRoutes([
        {
          name: 'foo',
          path: '/foo',
          component,
          children: createRoutes([{ name: 'zoo', path: '/zoo', component }]),
        },
        {
          path: '/bar',
          component,
          children: createRoutes([{ name: 'zoo', path: '/zoo', component }]),
        },
      ]),
    },
  ])

  type Map = RoutesMap<typeof routes>

  type Source = Map[keyof Map]['key']
  type Expect = 'foo' | 'foo.zoo' | 'zoo'

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})