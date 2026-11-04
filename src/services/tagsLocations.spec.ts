import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { tagsLocations } from '@/services/tagsLocations'

test('includes only matches with their own tags callback', () => {
  const parent = createRoute({ path: '/' }).setTags(() => {})
  const child = createRoute({ parent, path: 'child' })

  expect(tagsLocations(parent.matches[0], 0)).toEqual([{ kind: 'tags', depth: 0, name: 'tags' }])
  expect(tagsLocations(child.matches[1], 1)).toEqual([])
})
