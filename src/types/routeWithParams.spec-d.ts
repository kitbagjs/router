import { expectTypeOf, test } from 'vitest'
import { RouteGetByKey } from '@/types/routeWithParams'
import { createRoute } from '@/services/createRoute'

test('RouteGetByName works as expected', () => {
  const parentA = createRoute({
    name: 'parentA',
    path: '/parentA/[paramA]',
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const childA = createRoute({
    parent: parentA,
    name: 'parentA.childA',
    path: '/childA/[?paramB]',
  })

  type Routes = [typeof parentA, typeof childA]
  type Source = RouteGetByKey<Routes, 'parentA.childA'>
  type Expect = typeof childA

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})
