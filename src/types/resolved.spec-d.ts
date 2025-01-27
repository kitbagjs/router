import { expectTypeOf, test } from 'vitest'
import { RouterRoute } from '@/services/createRouterRoute'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/route'
import { WithParams } from '@/services/withParams'

test('given a specific Route, params are narrow', () => {
    type TestRoute = Route<'parentA', WithParams<undefined, {}>, WithParams<'/[paramA]', {}>, WithParams<'foo=[paramB]&bar=[?paramC]', { paramB: BooleanConstructor }>>

    type Source = RouterRoute<ResolvedRoute<TestRoute>>['params']
    type Expect = { paramA: string, paramB: boolean, paramC?: string | undefined }

    expectTypeOf<Expect>().toMatchTypeOf<Source>()
})

test('without a specific Route, params are Record<string, unknown>', () => {
  type Source = RouterRoute['params']
  type Expect = Record<string, Readonly<unknown>>

  expectTypeOf<Expect>().toMatchTypeOf<Source>()
})
