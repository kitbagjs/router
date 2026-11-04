import { expect, test, vi } from 'vitest'
import { createRouteTags } from '@/services/createRouteTags'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { CallbackContextResponse } from '@/types/callbackContext'
import { TagLayer } from '@/types/tags'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'

test('writes and operation reads do not subscribe to ancestors', () => {
  const parent = createRoute({ path: '/' }).setTags(() => {})
  const route = createResolvedRoute(createRoute({ parent, path: 'child' }))
  const subscribe = vi.fn(() => new Promise<never>(() => {}))
  const tags = createRouteTags({ route, depth: 1, subscribe })

  tags.title.set('Child')

  expect(tags.operations).toMatchObject([{ kind: 'set', groups: [{ value: 'Child' }] }])
  expect(subscribe).not.toHaveBeenCalled()
})

test('reads await stored ancestor tags, skip failed layers, and exclude this scope and descendants', async () => {
  const root = createRoute({ path: '/' }).setTags(() => {})
  const middle = createRoute({ parent: root, path: 'middle' })
  const parent = createRoute({ parent: middle, path: 'parent' }).setTags(() => {})
  const child = createRoute({ parent, path: 'child' }).setTags(() => {})
  const route = createResolvedRoute(createRoute({ parent: child, path: 'leaf' }).setTags(() => {}))
  const rootLayer: TagLayer = [{
    kind: 'set',
    target: { tag: 'title', attributes: {} },
    groups: [{ tag: 'title', attributes: {}, value: 'Root' }],
  }]
  const pending = Promise.withResolvers<CallbackContextResponse>()
  const subscribe = vi.fn<() => Promise<CallbackContextResponse>>()
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce({ status: 'ERROR', source: 'tags', error: new Error('parent failed') })
  const tags = createRouteTags({ route, depth: 3, subscribe })
  const title = tags.title.get()

  expect(subscribe.mock.calls).toEqual([
    [{ kind: 'tags', depth: 0, name: 'tags' }],
    [{ kind: 'tags', depth: 2, name: 'tags' }],
  ])
  pending.resolve({ status: 'SUCCESS', value: rootLayer })
  await expect(title).resolves.toBe('Root')
  expect(tags.operations).toEqual([])
})

test('reads propagate abandoned subscriptions', async () => {
  const parent = createRoute({ path: '/' }).setTags(() => {})
  const route = createResolvedRoute(createRoute({ parent, path: 'child' }))
  const error = new NavigationAbandonedError()
  const subscribe = vi.fn().mockRejectedValue(error)
  const tags = createRouteTags({ route, depth: 1, subscribe })

  await expect(tags.title.get()).rejects.toBe(error)
})
