import { expect, test, vi } from 'vitest'
import { warnWaitingOnUncomputedValue } from '@/services/warnWaitingOnUncomputedValue'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import * as warnings from '@/utilities/warn'

test('uncomputed dependency warnings use the shared warning utility', () => {
  const warn = vi.spyOn(warnings, 'warn').mockImplementation(() => {})
  const route = createResolvedRoute(createRoute({ path: '/', name: 'home' }))

  warnWaitingOnUncomputedValue({ kind: 'loader', depth: 0, name: 'default' }, route)

  expect(warn).toHaveBeenCalledOnce()
})
