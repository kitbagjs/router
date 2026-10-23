import { expect, test } from 'vitest'
import { createRoute } from './createRoute'
import { createResolvedRoute } from './createResolvedRoute'
import { getPrefetchKey } from './getPrefetchKey'

test('prefetch keys use param serializers and ignore undeclared state', () => {
  const route = createRoute({
    path: '/',
    state: {
      count: {
        get: BigInt,
        set: (value: bigint) => value.toString(),
      },
    },
  })
  const resolved = createResolvedRoute(route, {}, { state: { count: 1n } })
  const extraState = {
    ...resolved,
    state: { count: 1n, undeclared: 2n },
  }
  const changedState = {
    ...resolved,
    state: { count: 2n },
  }

  expect(getPrefetchKey(extraState)).toBe(getPrefetchKey(resolved))
  expect(getPrefetchKey(changedState)).not.toBe(getPrefetchKey(resolved))
})
