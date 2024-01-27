import { describe, expectTypeOf, test } from 'vitest'
import { RouteMethods } from '@/types/routeMethods'
import { ExtractRoutePathParameters, RoutePaths } from '@/types/routePaths'
import { routes } from '@/utilities/testHelpers'

describe('RoutePaths', () => {

  test('returns correct keys for routes', () => {
    type Source = RoutePaths<typeof routes>
    type Expect = 'parentA' | 'parentB' | 'parentA.childA' | 'parentA.childA.grandChildA' | 'parentA.childB'

    expectTypeOf<Source>().toMatchTypeOf<Expect>()
  })

})

describe('ExtractRoutePathParameters', () => {

  test('returns parameters for route', () => {
    type Source = ExtractRoutePathParameters<RouteMethods<typeof routes>, 'parentA.childA.grandChildA'>
    type Expect = {
      paramA: [string, string],
      paramB?: string | undefined,
      paramC: string,
    }

    expectTypeOf<Source>().toMatchTypeOf<Expect>()
  })

  test('returns never when route has no params', () => {
    type Source = ExtractRoutePathParameters<RouteMethods<typeof routes>, 'parentB'>
    type Expect = never

    expectTypeOf<Source>().toMatchTypeOf<Expect>()
  })

})

