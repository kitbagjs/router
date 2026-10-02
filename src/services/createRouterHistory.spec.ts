import { flushPromises } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { createRouterHistory } from '@/services/createRouterHistory'
import { NavigationPrepare } from '@/types/routerHistory'

test('auto selects memory without a browser and commits only after preparation', async () => {
  const guard = Promise.withResolvers<undefined>()
  const commit = vi.fn(async () => {
    expect(history.location.pathname).toBe('/foo')
  })
  const prepare = vi.fn(async () => {
    await guard.promise
    return { signal: new AbortController().signal, commit }
  })
  const history = createRouterHistory({ prepare })
  const pending = history.push('/foo')

  expect(history.location.pathname).toBe('/')
  expect(commit).not.toHaveBeenCalled()

  guard.resolve(undefined)
  await pending

  expect(prepare).toHaveBeenCalledOnce()
  expect(commit).toHaveBeenCalledOnce()
})

test('declined preparation leaves the current entry unchanged', async () => {
  const history = createRouterHistory({ mode: 'memory', prepare: async () => undefined })
  const initial = history.location

  await history.push('/foo')

  expect(history.location).toBe(initial)
})

test('cancellation after preparation prevents the history write', async () => {
  const controller = new AbortController()
  const commit = vi.fn()
  const history = createRouterHistory({
    mode: 'memory',
    prepare: async () => {
      controller.abort()
      return { signal: controller.signal, commit }
    },
  })
  const initial = history.location

  await history.push('/canceled')

  expect(history.location).toBe(initial)
  expect(commit).not.toHaveBeenCalled()
})

test('a redirect commits its destination without writing the original URL afterward', async () => {
  const committed: string[] = []
  const prepare: NavigationPrepare = async (url) => {
    if (url === '/first') {
      return { redirect: '/second', options: {} }
    }

    return {
      signal: new AbortController().signal,
      commit: async () => {
        committed.push(url)
      },
    }
  }
  const history = createRouterHistory({ mode: 'memory', prepare })

  await history.push('/first')

  expect(history.location.pathname).toBe('/second')
  expect(committed).toEqual(['/second'])
})

test('refresh prepares the current URL and state again', async () => {
  const prepare = vi.fn(async () => ({ signal: new AbortController().signal, commit: async () => {} }))
  const history = createRouterHistory({ mode: 'memory', prepare })

  await history.push('/foo', { state: { visit: 1 } })
  prepare.mockClear()
  history.refresh()
  await flushPromises()

  expect(prepare).toHaveBeenCalledWith('/foo', { replace: true, state: { visit: 1 } }, expect.anything())
})

test('traversal prepares the destination without replacing its entry', async () => {
  const prepare = vi.fn(async () => ({ signal: new AbortController().signal, commit: async () => {} }))
  const history = createRouterHistory({ mode: 'memory', prepare })

  history.startListening()
  await history.push('/first')
  const first = history.location

  await history.push('/second')
  prepare.mockClear()
  history.back()
  await flushPromises()

  expect(prepare).toHaveBeenCalledOnce()
  expect(prepare).toHaveBeenCalledWith('/first', { state: null }, expect.anything())
  expect(history.location).toBe(first)
})

test('hydration adoption writes memory state without preparing a navigation', () => {
  const prepare = vi.fn()
  const history = createRouterHistory({ mode: 'memory', prepare })

  history.startListening()
  history.adopt('/hydrated', { replace: true, state: { visit: 2 } })

  expect(history.location.pathname).toBe('/hydrated')
  expect(history.location.state).toEqual({ visit: 2 })
  expect(prepare).not.toHaveBeenCalled()
})

test('a declined redirect preserves the original entry and forwards redirect options', async () => {
  const options = { replace: true, state: { visit: 3 } }
  const prepare = vi.fn<NavigationPrepare>(async (url) => {
    if (url === '/first') {
      return { redirect: '/second', options }
    }

    return undefined
  })
  const history = createRouterHistory({ mode: 'memory', prepare })
  const original = history.location

  await history.push('/first')

  expect(prepare).toHaveBeenLastCalledWith('/second', options, {})
  expect(history.location).toBe(original)
})

test('preparation errors reach the caller without changing history', async () => {
  const failure = new Error('guard failed')
  const history = createRouterHistory({
    mode: 'memory',
    prepare: async () => {
      throw failure
    },
  })
  const original = history.location

  await expect(history.push('/first')).rejects.toBe(failure)
  expect(history.location).toBe(original)
})
