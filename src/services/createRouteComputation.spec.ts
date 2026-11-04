import { afterEach, expect, test, vi } from 'vitest'
import { createRouteComputation } from '@/services/createRouteComputation'
import * as props from '@/services/createPropsComputation'
import * as loaders from '@/services/createLoaderComputation'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { CreateRouteComputationOptions } from '@/types/computation'

afterEach(() => {
  vi.restoreAllMocks()
})

test.each(['props', 'loader'] as const)('dispatches %s to its factory', (kind) => {
  const propsFactory = vi.spyOn(props, 'createPropsComputation')
  const loaderFactory = vi.spyOn(loaders, 'createLoaderComputation')
  const options: CreateRouteComputationOptions = {
    location: { kind, depth: 0, name: 'default' },
    route: createResolvedRoute(createRoute({ path: '/' })),
    callback: vi.fn(),
  }

  const computation = createRouteComputation(options)

  if (kind === 'props') {
    expect(propsFactory).toHaveBeenCalledExactlyOnceWith(options)
    expect(computation).toBe(propsFactory.mock.results[0].value)
    expect(loaderFactory).not.toHaveBeenCalled()
    return
  }

  expect(loaderFactory).toHaveBeenCalledExactlyOnceWith(options)
  expect(computation).toBe(loaderFactory.mock.results[0].value)
  expect(propsFactory).not.toHaveBeenCalled()
})
