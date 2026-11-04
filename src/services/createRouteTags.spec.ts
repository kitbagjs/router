import { expect, test, vi } from 'vitest'
import { createRouteTags } from '@/services/createRouteTags'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { TagLayer } from '@/types/tags'

const rootLayer: TagLayer = [{
  kind: 'set',
  target: { tag: 'title', attributes: {} },
  groups: [{ tag: 'title', attributes: {}, value: 'Root' }],
}]

test('writes and operation reads do not read ancestors', () => {
  const parent = createRoute({ path: '/' }).setTags(() => {})
  const route = createResolvedRoute(createRoute({ parent, path: 'child' }))
  const getValue = vi.fn()
  const tags = createRouteTags({ route, depth: 1, getValue })

  tags.title.set('Child')
  const operations = tags.operations

  expect(operations).toHaveLength(1)
  expect(getValue).not.toHaveBeenCalled()
})

test('reads only tag-owning ancestors in match order', async () => {
  const root = createRoute({ path: '/' }).setTags(() => {})
  const middle = createRoute({ parent: root, path: 'middle' })
  const parent = createRoute({ parent: middle, path: 'parent' }).setTags(() => {})
  const child = createRoute({ parent, path: 'child' }).setTags(() => {})
  const route = createResolvedRoute(createRoute({ parent: child, path: 'leaf' }).setTags(() => {}))
  const getValue = vi.fn<() => Promise<TagLayer>>()
    .mockResolvedValue(rootLayer)
  const tags = createRouteTags({ route, depth: 3, getValue })

  await tags.title.get()

  expect(getValue.mock.calls).toEqual([
    [{ kind: 'tags', depth: 0, name: 'tags' }],
    [{ kind: 'tags', depth: 2, name: 'tags' }],
  ])
})
