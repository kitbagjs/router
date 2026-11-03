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

function runCallback<TRoute extends Route>(definition: TRoute, { kind = 'props', depth = 0, getValue = vi.fn().mockResolvedValue('value'), getValues = vi.fn().mockReturnValue({}) }: {
  kind?: DataKind,
  depth?: number,
  getValue?: ComputationContext['getValue'],
  getValues?: ComputationContext['getValues'],
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
    location: { kind, id: definition.id, name: 'default' },
    route: to,
    depth,
    callback,
  })

  computation.run({ to, signal, getValue, getValues, getState: vi.fn(), subscribe: vi.fn() })
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
  expect(getValue).toHaveBeenNthCalledWith(1, { kind: 'loader', id: definition.id, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(2, { kind: 'loader', id: definition.id, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(3, { kind: 'loader', id: definition.id, name: 'count' })
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
  expect(getValue).toHaveBeenNthCalledWith(1, { kind: 'loader', id: root.id, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(2, { kind: 'loader', id: root.id, name: 'ancestor' })
  expect(getValue).toHaveBeenNthCalledWith(3, { kind: 'loader', id: parent.id, name: 'count' })
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
  expect(getValue).toHaveBeenNthCalledWith(1, { kind: 'props', id: parent.id, name: 'default' })
  expect(getValue).toHaveBeenNthCalledWith(2, { kind: 'props', id: parent.id, name: 'summary' })
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

test('legacy getters request value records from their computation context', () => {
  const values = { default: Promise.resolve('value') }
  const getValues = vi.fn<ComputationContext['getValues']>().mockReturnValue(values)
  const legacy = Promise.resolve('legacy')
  const adapt = vi.spyOn(legacyValues, 'toLegacyValues').mockReturnValue(legacy)
  const parent = createRoute({ path: '/' }).addLoader(() => 'parent')
    .addView(component, { props: () => ({}) })
  const child = createRoute({ parent, path: 'child' }).addLoader(() => 'child', { name: 'child' })
  const { route, context, getValue } = runCallback(child, { depth: 1, getValues })

  expect(Reflect.get(route, 'data')).toBe(legacy)
  expect(Reflect.get(context.parent, 'data')).toBe(legacy)
  expect(Reflect.get(context.parent, 'props')).toBe(legacy)
  expect(getValues).toHaveBeenNthCalledWith(1, [
    expect.objectContaining({ kind: 'loader', id: parent.id, name: 'default' }),
    expect.objectContaining({ kind: 'loader', id: child.id, name: 'child' }),
  ])
  expect(getValues).toHaveBeenNthCalledWith(2, [{ kind: 'loader', id: parent.id, name: 'default' }])
  expect(getValues).toHaveBeenNthCalledWith(3, [{ kind: 'props', id: parent.id, name: 'default' }])
  expect(adapt).toHaveBeenCalledWith(values)
  expect(getValue).not.toHaveBeenCalled()
})

test('loader callbacks cannot subscribe to their own route data', () => {
  const definition = createRoute({ path: '/' }).addLoader(() => 'data')
  const { route, getValue } = runCallback(definition, { kind: 'loader' })

  expect(() => route.getData()).toThrow(LoaderDataAccessError)
  expect(getValue).not.toHaveBeenCalled()
})
