import { expectTypeOf, test } from 'vitest'
import * as main from '@/main'

test('exports the resolved route guard and type', () => {
  expectTypeOf(main.isResolvedRoute).toBeFunction()
  expectTypeOf<main.ResolvedRoute>().not.toBeAny()
})

test('does not export the resolved route internals', () => {
  expectTypeOf<'IS_RESOLVED_ROUTE_SYMBOL'>().not.toExtend<keyof typeof main>()

  // @ts-expect-error - internal, not part of the public api
  expectTypeOf<main.ResolvedRouteInternal>()
})
