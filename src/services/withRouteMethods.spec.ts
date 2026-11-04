import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { CreatedRouteOptions } from '@/types/route'

test('setTags replaces only the current match callback without requiring a returned route', () => {
  const initial = vi.fn()
  const replacement = vi.fn()
  const route = createRoute({ path: '/' }).setTags(initial)

  route.setTags(replacement)

  const matches: CreatedRouteOptions[] = route.matches

  expect(matches.map(({ tags }) => tags)).toEqual([replacement])
})
