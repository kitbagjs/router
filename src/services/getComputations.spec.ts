import { afterEach, expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { getComputations, getComputationsForStrategy } from '@/services/getComputations'
import * as propsFactory from '@/services/createPropsComputation'
import * as loaderFactory from '@/services/createLoaderComputation'
import { component } from '@/utilities/testHelpers'

afterEach(() => {
  vi.restoreAllMocks()
})

test('creates computations with each matched callback and its options', () => {
  const props = vi.fn(() => ({}))
  const load = vi.fn(() => 'loaded')
  const transformer = { stringify: JSON.stringify, parse: JSON.parse }
  const parent = createRoute({ path: '/', prefetch: 'intent' })
    .addView(component, { name: 'summary', props, prefetch: 'eager', transformer })
    .addView(component, { name: 'empty' })
  const child = createRoute({ parent, path: 'child', prefetch: false })
    .addLoader(load, { name: 'item', prefetch: 'lazy', transformer })
  const route = createResolvedRoute(child)
  const createProps = vi.spyOn(propsFactory, 'createPropsComputation')
  const createLoader = vi.spyOn(loaderFactory, 'createLoaderComputation')
  getComputations(route)

  expect(createProps).toHaveBeenCalledExactlyOnceWith({
    location: { kind: 'props', depth: 0, name: 'summary' },
    route,
    callback: props,
    routePrefetch: 'intent',
    prefetch: 'eager',
    transformer,
  })
  expect(createLoader).toHaveBeenCalledExactlyOnceWith({
    location: { kind: 'loader', depth: 1, name: 'item' },
    route,
    callback: load,
    routePrefetch: false,
    prefetch: 'lazy',
    transformer,
  })
  expect(props).not.toHaveBeenCalled()
  expect(load).not.toHaveBeenCalled()
})

test('selects props and loaders using their separate prefetch options', () => {
  const definition = createRoute({ path: '/' })
    .addView(component, { props: () => ({}) })
    .addLoader(() => 'data')
  const route = createResolvedRoute(definition)
  const configs = { routerPrefetch: { props: 'eager', loaders: 'intent' } } as const

  expect(getComputationsForStrategy(route, 'eager', configs).map(({ kind }) => kind)).toEqual(['props'])
  expect(getComputationsForStrategy(route, 'intent', configs).map(({ kind }) => kind)).toEqual(['loader'])
})

test('creates tag computations in ancestor order across matches without tags', () => {
  const parent = createRoute({ path: '/' }).setTags(() => {})
  const middle = createRoute({ parent, path: 'middle' })
  const child = createRoute({ parent: middle, path: 'child' }).setTags(() => {})
  const computations = getComputations(createResolvedRoute(child))

  expect(computations.map(({ kind, depth, name }) => ({ kind, depth, name }))).toEqual([
    { kind: 'tags', depth: 0, name: 'tags' },
    { kind: 'tags', depth: 2, name: 'tags' },
  ])
})

test('tag prefetch is disabled by default', () => {
  const route = createResolvedRoute(createRoute({ path: '/' }).setTags(() => {}))

  expect(getComputationsForStrategy(route, 'lazy', {})).toEqual([])
})

test('tag prefetch uses its own option alongside loader prefetch', () => {
  const route = createResolvedRoute(createRoute({ path: '/' })
    .addLoader(() => 'data')
    .setTags(() => {}))
  const configs = { routerPrefetch: { tags: 'eager', loaders: 'intent' } } as const

  expect(getComputationsForStrategy(route, 'eager', configs).map(({ kind }) => kind)).toEqual(['tags'])
})
