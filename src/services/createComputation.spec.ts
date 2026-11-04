import { expect, test, vi } from 'vitest'
import { createComputation } from '@/services/createComputation'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { getDataKey } from '@/services/getDataKey'
import { ValueLocation } from '@/types/computation'

test('combines a location and destination key with its execution and options', () => {
  const route = createResolvedRoute(createRoute({ path: '/' }))
  const location: ValueLocation = { kind: 'props', depth: 0, name: 'default' }
  const run = vi.fn()
  const transformer = { stringify: JSON.stringify, parse: JSON.parse }
  const computation = createComputation({ location, route, run, routePrefetch: 'lazy', prefetch: 'eager', transformer })

  expect(computation).toEqual({ ...location, key: getDataKey({ ...location, route }), run, routePrefetch: 'lazy', prefetch: 'eager', transformer })
  expect(run).not.toHaveBeenCalled()
})
