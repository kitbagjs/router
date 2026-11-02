import { expect, test, vi } from 'vitest'
import { createRouteComputation } from '@/services/createRouteComputation'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { LoaderDataAccessError } from '@/errors/loaderDataAccessError'
import { component } from '@/utilities/testHelpers'

test('props callbacks receive lazy route data backed by the computation reader', async () => {
  const definition = createRoute({ path: '/' }).addLoader(() => 'data', { name: 'product' })
  const to = createResolvedRoute(definition)
  const callback = vi.fn()
  const getValue = vi.fn().mockResolvedValue('data')
  const signal = new AbortController().signal
  const computation = createRouteComputation({
    location: { kind: 'props', id: definition.id, name: 'default' },
    route: to,
    depth: 0,
    callback,
  })

  computation.run({ to, signal, getValue, getState: vi.fn(), subscribe: vi.fn() })
  const [route, context] = callback.mock.calls[0]

  expect(getValue).not.toHaveBeenCalled()
  expect(context.signal).toBe(signal)
  expect(context.parent).toBeUndefined()
  await expect(route.getData('product')).resolves.toBe('data')
  expect(getValue).toHaveBeenCalledExactlyOnceWith({ kind: 'loader', id: definition.id, name: 'product' })
})

test('parent reads select the callback depth and delegate to the computation reader', async () => {
  const parent = createRoute({ name: 'parent', path: '/' })
    .addLoader(() => 'parent data')
    .addView(component, { props: () => ({ value: 'parent props' }) })
  const child = createRoute({ parent, path: 'child' })
  const to = createResolvedRoute(child)
  const callback = vi.fn()
  const getValue = vi.fn().mockResolvedValue('value')
  const computation = createRouteComputation({
    location: { kind: 'props', id: child.id, name: 'default' },
    route: to,
    depth: 1,
    callback,
  })

  computation.run({ to, signal: new AbortController().signal, getValue, getState: vi.fn(), subscribe: vi.fn() })
  const [, context] = callback.mock.calls[0]

  expect(context.parent.name).toBe('parent')
  await context.parent.getData()
  await context.parent.getProps()
  expect(getValue.mock.calls).toEqual([
    [{ kind: 'loader', id: parent.id, name: 'default' }],
    [{ kind: 'props', id: parent.id, name: 'default' }],
  ])
})

test('loader callbacks cannot subscribe to their own route data', () => {
  const to = createResolvedRoute(createRoute({ path: '/' }))
  const callback = vi.fn()
  const getValue = vi.fn()
  const computation = createRouteComputation({
    location: { kind: 'loader', id: to.id, name: 'default' },
    route: to,
    depth: 0,
    callback,
  })

  computation.run({ to, signal: new AbortController().signal, getValue, getState: vi.fn(), subscribe: vi.fn() })
  const [route] = callback.mock.calls[0]

  expect(() => route.getData()).toThrow(LoaderDataAccessError)
  expect(getValue).not.toHaveBeenCalled()
})
