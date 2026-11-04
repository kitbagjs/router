import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { component } from '@/utilities/testHelpers'
import { CreatedRouteOptions } from '@/types/route'

test('setTags registers on the current match and remains chainable', () => {
  const parentTags = vi.fn()
  const childTags = vi.fn()
  const parent = createRoute({ path: '/' }).setTags(parentTags)
  const child = createRoute({ parent, path: 'child' })
  const result = child.setTags(childTags)

  expect(result).toBe(child)

  const route = result.addLoader(() => 'data').addView(component)
  const matches: CreatedRouteOptions[] = route.matches

  expect(matches.map(({ tags }) => tags)).toEqual([parentTags, childTags])
})

test('setTags replaces only the current match callback without requiring a returned route', () => {
  const initial = vi.fn()
  const replacement = vi.fn()
  const route = createRoute({ path: '/' }).setTags(initial)

  route.setTags(replacement)

  const matches: CreatedRouteOptions[] = route.matches

  expect(matches.map(({ tags }) => tags)).toEqual([replacement])
})
