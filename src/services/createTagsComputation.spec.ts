import { expect, test, vi } from 'vitest'
import { createTagsComputation } from '@/services/createTagsComputation'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { Tags } from '@/types/tags'

test('synchronous writes return a layer without introducing a promise', () => {
  const to = createResolvedRoute(createRoute({ path: '/' }))
  const callback = (tags: Tags): void => tags.title.set('Child')
  const computation = createTagsComputation({ location: { kind: 'tags', depth: 0, name: 'tags' }, route: to, callback })
  const layer = computation.run({ to, signal: new AbortController().signal, getValue: vi.fn(), subscribe: vi.fn() })

  expect(layer).toMatchObject([{ kind: 'set', groups: [{ value: 'Child' }] }])
})
