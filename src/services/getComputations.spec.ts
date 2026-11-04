import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { getComputationsForStrategy } from '@/services/getComputations'

test('tag prefetch is disabled by default', () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).setTags(() => {}))

  expect(getComputationsForStrategy(route, 'lazy', {})).toEqual([])
})

test('tag prefetch uses its own option alongside loader prefetch', () => {
  const route = createResolvedRoute(createRoute({ path: '/' })
    .addLoader(() => 'data')
    .setTags(() => {}))
  const configs = { routerPrefetch: { tags: 'eager', loaders: 'intent' } } as const

  expect(getComputationsForStrategy(route, 'eager', configs).map(({ kind }) => kind)).toEqual(['tags'])
})
