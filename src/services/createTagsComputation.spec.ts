import { afterEach, expect, test, vi } from 'vitest'
import { createTagsComputation } from '@/services/createTagsComputation'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import * as callbackRoute from '@/services/createCallbackRoute'
import * as callbackParent from '@/services/getCallbackParent'
import * as routeTags from '@/services/createRouteTags'
import { Tags } from '@/types/tags'

afterEach(() => {
  vi.restoreAllMocks()
})

test('passes the builder and callback context without navigation controls', () => {
  const parent = createRoute({ path: '/' })
  const to = createResolvedRoute(createRoute({ parent, path: 'child' }))
  const context = { to, signal: new AbortController().signal, getValue: vi.fn(), subscribe: vi.fn() }
  const routeFactory = vi.spyOn(callbackRoute, 'createCallbackRoute')
  const parentFactory = vi.spyOn(callbackParent, 'getCallbackParent')
  const tagsFactory = vi.spyOn(routeTags, 'createRouteTags')
  const callback = vi.fn()
  const computation = createTagsComputation({ location: { kind: 'tags', depth: 1, name: 'tags' }, route: to, callback })

  expect(callback).not.toHaveBeenCalled()
  computation.run(context)

  expect(routeFactory).toHaveBeenCalledExactlyOnceWith(context)
  expect(tagsFactory).toHaveBeenCalledExactlyOnceWith({ route: to, depth: 1, subscribe: context.subscribe })
  expect(parentFactory).toHaveBeenCalledExactlyOnceWith(1, context)
  expect(callback).toHaveBeenCalledExactlyOnceWith(tagsFactory.mock.results[0].value, {
    to: routeFactory.mock.results[0].value,
    signal: context.signal,
    parent: parentFactory.mock.results[0].value,
  })
})

test('synchronous writes return a layer without introducing a promise', () => {
  const to = createResolvedRoute(createRoute({ path: '/' }))
  const callback = (tags: Tags): void => tags.title.set('Child')
  const computation = createTagsComputation({ location: { kind: 'tags', depth: 0, name: 'tags' }, route: to, callback })
  const layer = computation.run({ to, signal: new AbortController().signal, getValue: vi.fn(), subscribe: vi.fn() })

  expect(layer).toMatchObject([{ kind: 'set', groups: [{ value: 'Child' }] }])
})

test('captures operations written after an async callback resumes', async () => {
  const pending = Promise.withResolvers<void>()
  const to = createResolvedRoute(createRoute({ path: '/' }))
  const callback = async (tags: Tags): Promise<void> => {
    tags.title.set('Before')
    await pending.promise
    tags.title.set('After')
  }
  const computation = createTagsComputation({ location: { kind: 'tags', depth: 0, name: 'tags' }, route: to, callback })
  const result = computation.run({ to, signal: new AbortController().signal, getValue: vi.fn(), subscribe: vi.fn() })

  pending.resolve()

  await expect(result).resolves.toMatchObject([
    { kind: 'set', groups: [{ value: 'Before' }] },
    { kind: 'set', groups: [{ value: 'After' }] },
  ])
})
