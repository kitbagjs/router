import { expect, test, vi } from 'vitest'
import { createTagsComputation } from '@/services/createTagsComputation'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { Tags } from '@/types/tags'
import { SetRouteTagsCallback } from '@/types/routeTags'

test('tag callbacks receive scoped writes, route data, and cancellation without navigation controls', async () => {
  const definition = createRoute({ path: '/' }).addLoader(() => 'Product')
  const to = createResolvedRoute(definition)
  const signal = new AbortController().signal
  const getValue = vi.fn().mockResolvedValue('Product')
  const subscribe = vi.fn()
  const callback = vi.fn<SetRouteTagsCallback<typeof definition>>(async (tags, { to }) => {
    tags.title.set(await to.getData())
  })
  const computation = createTagsComputation({ location: { kind: 'tags', depth: 0, name: 'tags' }, route: to, callback })
  const layer = await computation.run({ to, signal, getValue, subscribe })
  const [, context] = callback.mock.calls[0]

  expect(Object.keys(context).sort()).toEqual(['parent', 'signal', 'to'])
  expect(context.signal).toBe(signal)
  expect(context.to.href).toBe(to.href)
  expect(context.parent).toBeUndefined()
  expect(getValue).toHaveBeenCalledExactlyOnceWith({ kind: 'loader', depth: 0, name: 'default' })
  expect(subscribe).not.toHaveBeenCalled()
  expect(layer).toEqual([{
    kind: 'set',
    target: { tag: 'title', attributes: {} },
    groups: [{ tag: 'title', attributes: {}, value: 'Product' }],
  }])
})

test('synchronous tag callbacks return their result without introducing pending work', () => {
  const to = createResolvedRoute(createRoute({ path: '/' }))
  const subscribe = vi.fn()
  const callback = (tags: Tags): void => tags.title.set('Child')
  const computation = createTagsComputation({ location: { kind: 'tags', depth: 0, name: 'tags' }, route: to, callback })
  const layer = computation.run({ to, signal: new AbortController().signal, getValue: vi.fn(), subscribe })

  expect(layer).toMatchObject([{ kind: 'set', groups: [{ value: 'Child' }] }])
  expect(subscribe).not.toHaveBeenCalled()
})

test('a failed tag callback propagates its error instead of returning partial writes', async () => {
  const error = new Error('tags failed')
  const to = createResolvedRoute(createRoute({ path: '/' }))
  const callback = async (tags: Tags): Promise<void> => {
    tags.title.set('Partial')
    await Promise.resolve()
    throw error
  }
  const computation = createTagsComputation({ location: { kind: 'tags', depth: 0, name: 'tags' }, route: to, callback })
  const result = computation.run({ to, signal: new AbortController().signal, getValue: vi.fn(), subscribe: vi.fn() })

  await expect(result).rejects.toBe(error)
})
