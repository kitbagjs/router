import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { Route } from '@/types/route'
import { RoutesMap } from '@/types/routesMap'
import { component } from '@/utilities/testHelpers'

test('RoutesMap given generic routes, returns generic string', () => {
  type Map = RoutesMap<Route[]>

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
  })
    .addView(component)

  const zooFoo = createRoute({ name: 'zoofoo', path: '/zoofoo', parent: foo })
    .addView(component)

  const bar = createRoute({
    parent: root,
    path: '/bar',
  })
    .addView(component)

  const zooBar = createRoute({ name: 'zoo', path: '/zoo', parent: bar })
    .addView(component)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const routes = [
    root,
    foo,
    zooFoo,
    bar,
    zooBar,
  ]

  type Map = RoutesMap<typeof routes>

  type Source = keyof Map
  type Expect = 'foo' | 'zoofoo' | 'zoo'

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})
