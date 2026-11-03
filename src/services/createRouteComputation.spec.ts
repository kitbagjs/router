import { afterEach, expect, test, vi } from 'vitest'
import { createRouteComputation } from '@/services/createRouteComputation'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { ComputationContext } from '@/services/getComputations'
import { DataKind } from '@/services/getDataKey'
import { Route } from '@/types/route'
import { ResolvedRoute, WithData } from '@/types/resolved'
import { RouteCallbackContext } from '@/types/routeCallbackContext'
import { LoaderDataAccessError } from '@/errors/loaderDataAccessError'
import { component } from '@/utilities/testHelpers'
import * as legacyValues from '@/utilities/toLegacyValues'

afterEach(() => {
  vi.restoreAllMocks()
})

function runCallback<TRoute extends Route>(definition: TRoute, { kind = 'props', depth = 0, getValue = vi.fn().mockResolvedValue('value') }: {
  kind?: DataKind,
  depth?: number,
  getValue?: ComputationContext['getValue'],
} = {}): {
  route: ResolvedRoute<TRoute> & WithData<TRoute>,
  context: RouteCallbackContext<TRoute>,
  getValue: ComputationContext['getValue'],
  signal: AbortSignal,
} {
  const to = createResolvedRoute(definition)
  const signal = new AbortController().signal
  const callback = vi.fn()
  const computation = createRouteComputation({
    location: { kind, depth, name: 'default' },
    route: to,
    callback,
  })

  computation.run({ to, signal, getValue })
  const [route, context] = callback.mock.calls[0]

  return { route, context, getValue, signal }
}

test('route data selects default and named loaders lazily', async () => {
  const definition = createRoute({ path: '/' }).addLoader(() => 'default')
    .addLoader(() => 42, { name: 'count' })
  const { route, context, getValue, signal } = runCallback(definition)

  expect(getValue).not.toHaveBeenCalled()
  expect(context.signal).toBe(signal)
  expect(context.parent).toBeUndefined()
  await route.getData()
  await route.getData('default')
  await route.getData('count')
  expect(getValue).toHaveBeenNthCalledWith(1, { kind: 'loader', depth: 0, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(2, { kind: 'loader', depth: 0, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(3, { kind: 'loader', depth: 0, name: 'count' })
})

test('parent data includes ancestors and excludes child loaders', async () => {
  const root = createRoute({ path: '/' }).addLoader(() => 'default')
    .addLoader(() => 'ancestor', { name: 'ancestor' })
  const parent = createRoute({ parent: root, name: 'parent', path: 'parent' }).addLoader(() => 42, { name: 'count' })
  const child = createRoute({ parent, path: 'child' }).addLoader(() => 'child', { name: 'child' })
  const { context, getValue } = runCallback(child, { depth: 2 })

  expect(context.parent.name).toBe('parent')
  await context.parent.getData()
  await context.parent.getData('ancestor')
  await context.parent.getData('count')
  expect(() => Reflect.apply(context.parent.getData, undefined, ['child'])).toThrow(TypeError)
  expect(getValue).toHaveBeenNthCalledWith(1, { kind: 'loader', depth: 0, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(2, { kind: 'loader', depth: 0, name: 'ancestor' })
  expect(getValue).toHaveBeenNthCalledWith(3, { kind: 'loader', depth: 1, name: 'count' })
})

test('parent props select getters only from the immediate parent', async () => {
  const root = createRoute({ path: '/' }).addView(component, { name: 'ancestor', props: () => ({}) })
  const parent = createRoute({ parent: root, path: 'parent' }).addView(component, { props: () => ({}) })
    .addView(component, { name: 'summary', props: () => ({}) })
    .addView(component, { name: 'empty' })
  const child = createRoute({ parent, path: 'child' })
  const { context, getValue } = runCallback(child, { depth: 2 })

  await context.parent.getProps()
  await context.parent.getProps('summary')
  for (const name of ['empty', 'ancestor']) {
    expect(() => Reflect.apply(context.parent.getProps, undefined, [name])).toThrow(TypeError)
  }
  expect(getValue).toHaveBeenNthCalledWith(1, { kind: 'props', depth: 1, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(2, { kind: 'props', depth: 1, name: 'summary' })
})

test('callback data and parent getters preserve reader failures', async () => {
  const error = new Error('reader failed')
  const parent = createRoute({ path: '/' }).addLoader(() => 'data')
    .addView(component, { props: () => ({}) })
  const child = createRoute({ parent, path: 'child' })
  const getValue = vi.fn().mockRejectedValue(error)
  const { route, context } = runCallback(child, { depth: 1, getValue })

  await expect(route.getData()).rejects.toBe(error)
  await expect(context.parent.getData()).rejects.toBe(error)
  await expect(context.parent.getProps()).rejects.toBe(error)
})

test('legacy getters delegate names and their reader to the legacy adapter', () => {
  const legacy = Promise.resolve('legacy')
  const adapt = vi.spyOn(legacyValues, 'toLegacyValues').mockReturnValue(legacy)
  const parent = createRoute({ path: '/' }).addLoader(() => 'parent')
    .addView(component, { props: () => ({}) })
  const child = createRoute({ parent, path: 'child' }).addLoader(() => 'child', { name: 'child' })
  const { route, context, getValue } = runCallback(child, { depth: 1 })

  expect(Reflect.get(route, 'data')).toBe(legacy)
  expect(Reflect.get(context.parent, 'data')).toBe(legacy)
  expect(Reflect.get(context.parent, 'props')).toBe(legacy)
  expect(adapt).toHaveBeenNthCalledWith(1, [
    expect.objectContaining({ kind: 'loader', depth: 0, name: 'default' }),
    expect.objectContaining({ kind: 'loader', depth: 1, name: 'child' }),
  ], getValue)
  expect(adapt).toHaveBeenNthCalledWith(2, [{ kind: 'loader', depth: 0, name: 'default' }], getValue)
  expect(adapt).toHaveBeenNthCalledWith(3, [{ kind: 'props', depth: 0, name: 'default' }], getValue)
  expect(getValue).not.toHaveBeenCalled()
})

test('loader callbacks cannot subscribe to their own route data', () => {
  const definition = createRoute({ path: '/' }).addLoader(() => 'data')
  const { route, getValue } = runCallback(definition, { kind: 'loader' })

  expect(() => route.getData()).toThrow(LoaderDataAccessError)
  expect(getValue).not.toHaveBeenCalled()
})
