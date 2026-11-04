import { expect, test, vi } from 'vitest'
import { createRouteTags } from '@/services/createRouteTags'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { CallbackContextResponse } from '@/types/callbackContext'
import { TagLayer } from '@/types/tags'

const rootLayer: TagLayer = [{
  kind: 'set',
  target: { tag: 'title', attributes: {} },
  groups: [{ tag: 'title', attributes: {}, value: 'Root' }],
}]

test('writes and operation reads do not subscribe to ancestors', () => {
  const parent = createRoute({ path: '/' }).setTags(() => {})
  const route = createResolvedRoute(createRoute({ parent, path: 'child' }))
  const subscribe = vi.fn()
  const tags = createRouteTags({ route, depth: 1, subscribe })

  tags.title.set('Child')
  const operations = tags.operations

  expect(operations).toHaveLength(1)
  expect(subscribe).not.toHaveBeenCalled()
})

test('reads only tag-owning ancestors in match order', async () => {
  const root = createRoute({ path: '/' }).setTags(() => {})
  const middle = createRoute({ parent: root, path: 'middle' })
  const parent = createRoute({ parent: middle, path: 'parent' }).setTags(() => {})
  const child = createRoute({ parent, path: 'child' }).setTags(() => {})
  const route = createResolvedRoute(createRoute({ parent: child, path: 'leaf' }).setTags(() => {}))
  const subscribe = vi.fn<() => Promise<CallbackContextResponse>>()
    .mockResolvedValue({ status: 'SUCCESS', value: rootLayer })
  const tags = createRouteTags({ route, depth: 3, subscribe })

  await tags.title.get()

  expect(subscribe.mock.calls).toEqual([
    [{ kind: 'tags', depth: 0, name: 'tags' }],
    [{ kind: 'tags', depth: 2, name: 'tags' }],
  ])
})

test('a failed ancestor does not discard successful ancestor layers', async () => {
  const root = createRoute({ path: '/' }).setTags(() => {})
  const parent = createRoute({ parent: root, path: 'parent' }).setTags(() => {})
  const route = createResolvedRoute(createRoute({ parent, path: 'child' }))
  const subscribe = vi.fn<() => Promise<CallbackContextResponse>>()
    .mockResolvedValueOnce({ status: 'SUCCESS', value: rootLayer })
    .mockResolvedValueOnce({ status: 'ERROR', source: 'tags', error: new Error('parent failed') })
  const tags = createRouteTags({ route, depth: 2, subscribe })

  await expect(tags.title.get()).resolves.toBe('Root')
})
