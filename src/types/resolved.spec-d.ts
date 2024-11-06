import { expectTypeOf, test } from 'vitest'
import { RouterRoute } from '@/services/createRouterRoute'
import { Host } from '@/types/host'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/route'

test('given a specific Route, params are narrow', () => {
    type TestRoute = Route<'parentA', Host, Path<'/[paramA]', {}>, Query<'foo=[paramB]&bar=[?paramC]', { paramB: BooleanConstructor }>>

    type Source = RouterRoute<ResolvedRoute<TestRoute>>['params']
    type Expect = { paramA: string, paramB: boolean, paramC?: string | undefined }

    expectTypeOf<Expect>().toMatchTypeOf<Source>()
})

test('without a specific Route, params are Record<string, unknown>', () => {
  type Source = RouterRoute['params']
  type Expect = Record<string, Readonly<unknown>>

  expectTypeOf<Expect>().toMatchTypeOf<Source>()
})
