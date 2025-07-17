import { expectTypeOf, test } from 'vitest'
import { RouterRoute } from '@/services/createRouterRoute'
import { ResolvedRoute } from '@/types/resolved'
import { withParams } from '@/services/withParams'
import { createRoute } from '@/services/createRoute'

test('given a specific Route, params are narrow', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const testRoute = createRoute({
    name: 'parentA',
    path: '/parentA/[paramA]',
    query: withParams('foo=[paramB]&bar=[?paramC]', { paramB: Boolean }),
  })

    type TestRoute = typeof testRoute

    type Source = RouterRoute<ResolvedRoute<TestRoute>>['params']
    type Expect = { paramA: string, paramB: boolean, paramC?: string | undefined }

    expectTypeOf<Expect>().toEqualTypeOf<Source>()
})

test('without a specific Route, params are Record<string, unknown>', () => {
  type Source = RouterRoute['params']
  type Expect = Record<string, unknown>

  expectTypeOf<Expect>().toEqualTypeOf<Source>()
})
