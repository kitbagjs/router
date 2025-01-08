import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { Host } from '@/types/host'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { Route } from '@/types/route'
import { RoutesMap } from '@/types/routesMap'
import { component } from '@/utilities/testHelpers'

test('RoutesMap given generic routes, returns generic string', () => {
  type Map = RoutesMap<Route<string, Host, Path<'', {}>, Query<'', {}>>[]>

  type Source = Map[keyof Map]['name']
  type Expect = string

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('RoutesMap given unnamed parents, removes them from return value and children names', () => {
  const root = createRoute({
    path: '/',
  })

  const foo = createRoute({
    parent: root,
    name: 'foo',
    path: '/foo',
    component,
  })

  const zooFoo = createRoute({ name: 'zoofoo', path: '/zoofoo', component, parent: foo })

  const bar = createRoute({
    parent: root,
    path: '/bar',
    component,
  })

  const zooBar = createRoute({ name: 'zoo', path: '/zoo', component, parent: bar })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const routes = [
    root,
    foo,
    zooFoo,
    bar,
    zooBar,
  ] as const

  type Map = RoutesMap<typeof routes>

  type Source = keyof Map
  type Expect = 'foo' | 'zoofoo' | 'zoo'

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})
