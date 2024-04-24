import { expectTypeOf, test } from 'vitest'
import { RouterRoute } from '@/types/resolved'
import { Route } from '@/types/route'
import { Path, Query } from '@/utilities'

test('given a specific Route, params are narrow', () => {
    type TestRoute = Route<'parentA', Path<'/:paramA', {}>, Query<'foo=:paramB&bar=:?paramC', { paramB: BooleanConstructor }>>

    type Source = RouterRoute<TestRoute>['params']
    type Expect = { paramA: string, paramB: boolean, paramC?: string | undefined }

    expectTypeOf<Expect>().toMatchTypeOf<Source>()
})

test('without a specific Route, params are Record<string, unknown>', () => {
  type Source = RouterRoute['params']
  type Expect = Record<string, unknown>

  expectTypeOf<Expect>().toMatchTypeOf<Source>()
})