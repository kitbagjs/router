import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { loaderLocations } from '@/services/loaderLocations'

test('selects loaders from the supplied match without including ancestors', () => {
  const parent = createRoute({ path: '/' }).addLoader(() => 'parent', { name: 'parent' })
  const child = createRoute({ parent, path: 'child' })
    .addLoader(() => 'default')
    .addLoader(() => 'named', { name: 'named' })

  expect(loaderLocations(child.matches[1], 1)).toEqual([
    { kind: 'loader', depth: 1, name: 'default' },
    { kind: 'loader', depth: 1, name: 'named' },
  ])
})
