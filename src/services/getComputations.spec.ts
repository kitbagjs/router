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

test('tags have their own storage kind and retain ancestor order across matches without tags', () => {
  const parent = createRoute({ path: '/' }).setTags((tags) => tags.title.set('Parent'))
  const middle = createRoute({ parent, path: 'middle' })
  const child = createRoute({ parent: middle, path: 'child' })
    .addLoader(() => 'loader', { name: 'tags' })
    .setTags((tags) => tags.title.set('Child'))
  const computations = getComputations(createResolvedRoute(child))

  expect(computations.map(({ kind, depth, name }) => ({ kind, depth, name }))).toEqual([
    { kind: 'tags', depth: 0, name: 'tags' },
    { kind: 'loader', depth: 2, name: 'tags' },
    { kind: 'tags', depth: 2, name: 'tags' },
  ])
  expect(new Set(computations.map(({ key }) => key)).size).toBe(3)
})

test('tag prefetch follows route and link strategy overrides and is disabled by default', () => {
  const parent = createRoute({ path: '/' }).setTags(() => {})
  const child = createRoute({
    parent,
    path: 'child',
    prefetch: { tags: 'intent' },
  }).setTags(() => {})
  const route = createResolvedRoute(child)

  expect(getComputationsForStrategy(route, 'lazy', {})).toEqual([])
  expect(getComputationsForStrategy(route, 'intent', {}).map(({ depth }) => depth)).toEqual([1])
  expect(getComputationsForStrategy(route, 'eager', { routerPrefetch: { tags: 'eager' } }).map(({ depth }) => depth)).toEqual([0])
  expect(getComputationsForStrategy(route, 'lazy', { linkPrefetch: { tags: true } }).map(({ depth }) => depth)).toEqual([0])
  expect(getComputationsForStrategy(route, 'intent', { linkPrefetch: { tags: true } }).map(({ depth }) => depth)).toEqual([1])
  expect(getComputationsForStrategy(route, 'intent', { linkPrefetch: { tags: false } })).toEqual([])
})
