import { afterEach, expect, test, vi } from 'vitest'
import { createRouteComputation } from '@/services/createRouteComputation'
import * as props from '@/services/createPropsComputation'
import * as loaders from '@/services/createLoaderComputation'
import * as tags from '@/services/createTagsComputation'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { CreateRouteComputationOptions } from '@/types/computation'

afterEach(() => {
  vi.restoreAllMocks()
})

test.each(['props', 'loader', 'tags'] as const)('dispatches %s to its factory', (kind) => {
  const factories = {
    props: vi.spyOn(props, 'createPropsComputation'),
    loader: vi.spyOn(loaders, 'createLoaderComputation'),
    tags: vi.spyOn(tags, 'createTagsComputation'),
  }
  const options: CreateRouteComputationOptions = {
    location: { kind, depth: 0, name: 'default' },
    route: createResolvedRoute(createRoute({ path: '/' })),
    callback: vi.fn(),
  }

  const computation = createRouteComputation(options)

  expect(factories[kind]).toHaveBeenCalledExactlyOnceWith(options)
  expect(computation).toBe(factories[kind].mock.results[0].value)

  for (const [name, factory] of Object.entries(factories)) {
    if (name !== kind) {
      expect(factory).not.toHaveBeenCalled()
    }
  }
})
