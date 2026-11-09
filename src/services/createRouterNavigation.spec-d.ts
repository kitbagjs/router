import { expectTypeOf, test } from 'vitest'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { DataResult } from '@/services/createDataStore'
import { CallbackContextResponse } from '@/types/callbackContext'

test('navigation readers accept locations for every computation kind', () => {
  const navigation = createRouterNavigation().createStore()
  const route = createResolvedRoute(createRoute({ path: '/' }))
  const location = { kind: 'loader', depth: 0, name: 'default' } as const

  expectTypeOf(navigation.getState(location, route)).toEqualTypeOf<DataResult>()
  expectTypeOf(navigation.subscribe(location, route)).toEqualTypeOf<Promise<CallbackContextResponse>>()
  expectTypeOf(navigation.getValue(location, route)).toEqualTypeOf<Promise<unknown>>()
  expectTypeOf(navigation.getState({ kind: 'props', depth: 0, name: 'default' }, route)).toEqualTypeOf<DataResult>()
})
