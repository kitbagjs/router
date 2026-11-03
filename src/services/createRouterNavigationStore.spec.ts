import { expect, test, vi } from 'vitest'
import { createApp, inject } from 'vue'
import { createRouterNavigationStore } from './createRouterNavigationStore'
import { createVueAppStore } from './createVueAppStore'
import { createResolvedRoute } from './createResolvedRoute'
import { createRoute } from './createRoute'
import { Computation } from './getComputations'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'

function createComputation(key: string, run: Computation['run']): Computation {
  return { key, run, kind: 'loader', id: 'id', name: key, depth: 0, prefetch: undefined, routePrefetch: undefined, transformer: undefined }
}

function createFixture(): { store: ReturnType<typeof createRouterNavigationStore>, route: ReturnType<typeof createResolvedRoute> } {
  const store = createRouterNavigationStore(createVueAppStore())
  const route = createResolvedRoute(createRoute({ path: '/' }))

  return { store, route }
}

test('reads states, responses, and values by key', async () => {
  const { store, route } = createFixture()
  const pending = Promise.withResolvers<string>()
  const computation = createComputation('value', () => pending.promise)

  expect(store.getState('value')).toEqual({ status: 'MISSING' })
  const value = store.getValue('value')
  expect(store.getState('value')).toEqual({ status: 'PENDING' })
  store.compute(route, [computation])
  expect(store.getState('value')).toEqual({ status: 'RUNNING' })
  pending.resolve('loaded')

  await expect(value).resolves.toBe('loaded')
  await expect(store.subscribe('value')).resolves.toEqual({ status: 'SUCCESS', value: 'loaded' })
})

test('dependencies await their own store even when another store has the same key', async () => {
  const { store, route } = createFixture()
  const other = createFixture().store
  other.setEntries([{ key: 'loader', value: { status: 'SUCCESS', value: 'old' } }])
  const dependent = createComputation('props', ({ getValue }) => getValue('loader'))
  const [value] = store.compute(route, [dependent])

  expect(store.getState('props')).toEqual({ status: 'RUNNING' })
  await Promise.all(store.compute(route, [createComputation('loader', () => 'new')]))
  await expect(value).resolves.toEqual({ status: 'SUCCESS', value: 'new' })
})

test('filled entries skip computation and errors retain their original identity', async () => {
  const { store, route } = createFixture()
  const error = new Error('failed')
  const run = vi.fn()
  store.setEntries([
    { key: 'success', value: { status: 'SUCCESS', value: undefined } },
    { key: 'error', value: { status: 'ERROR', source: 'loader', error } },
  ])
  await Promise.all(store.compute(route, [createComputation('success', run)]))

  expect(run).not.toHaveBeenCalled()
  await expect(store.getValue('success')).resolves.toBeUndefined()
  await expect(store.getValue('error')).rejects.toBe(error)
})

test('abandonment cancels dependencies and blocks writes without clearing settled values', async () => {
  const { store, route } = createFixture()
  const cleanup = vi.fn()
  let signal: AbortSignal | undefined
  const dependent = createComputation('dependent', async (context) => {
    signal = context.signal
    try {
      return await context.getValue('missing')
    } finally {
      cleanup()
    }
  })
  store.setEntries([{ key: 'settled', value: { status: 'SUCCESS', value: 'retained' } }])
  const work = store.compute(route, [dependent])
  store.abandon()
  await Promise.allSettled(work)
  const run = vi.fn()
  store.compute(route, [createComputation('late', run)])
  store.setEntries([{ key: 'late', value: { status: 'SUCCESS', value: 'late' } }])

  expect(signal?.aborted).toBe(true)
  expect(cleanup).toHaveBeenCalledOnce()
  expect(run).not.toHaveBeenCalled()
  await expect(store.getValue('settled')).resolves.toBe('retained')
  await expect(store.getValue('late')).rejects.toBeInstanceOf(NavigationAbandonedError)
})

test('responses are replayed to an owner and later failures are delivered until its signal aborts', async () => {
  const { store, route } = createFixture()
  const error = new Error('failed')
  await Promise.all(store.compute(route, [createComputation('early', () => {
    throw error
  })]))
  const owner = new AbortController()
  const onResponse = vi.fn()
  store.onResponse(onResponse, owner.signal)
  expect(onResponse).toHaveBeenCalledExactlyOnceWith({ status: 'ERROR', source: 'loader', error })
  await Promise.all(store.compute(route, [createComputation('late', () => {
    throw error
  })]))
  expect(onResponse).toHaveBeenCalledTimes(2)
  owner.abort()
  await Promise.all(store.compute(route, [createComputation('obsolete', () => {
    throw error
  })]))
  expect(onResponse).toHaveBeenCalledTimes(2)
})

test.each([new ContextPushError(['/next']), new ContextRejectionError('NotFound')])('navigation actions cancel pending work and remain available to adoption', async (error) => {
  const { store, route } = createFixture()
  const waiting = store.getValue('pending')
  await Promise.all(store.compute(route, [createComputation('action', () => {
    throw error
  })]))
  const onResponse = vi.fn()
  store.onResponse(onResponse, new AbortController().signal)

  expect(onResponse).toHaveBeenCalledExactlyOnceWith(error.response)
  await expect(waiting).rejects.toBeInstanceOf(NavigationAbandonedError)
})

test('runs callbacks with the installed vue app context', async () => {
  const context = createVueAppStore()
  const app = createApp({})
  app.provide('value', 'injected')
  context.setVueApp(app)
  const store = createRouterNavigationStore(context)
  const { route } = createFixture()
  await Promise.all(store.compute(route, [createComputation('value', () => inject('value'))]))

  await expect(store.getValue('value')).resolves.toBe('injected')
})
