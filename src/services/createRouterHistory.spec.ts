import { flushPromises } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { createRouterHistory } from '@/services/createRouterHistory'

test('updates from the router do not notify the listener', () => {
  const listener = vi.fn()
  const history = createRouterHistory({ mode: 'memory', listener })

  history.startListening()
  history.update('/foo')
  history.update('/bar', { replace: true })

  expect(listener).not.toHaveBeenCalled()
})

test('history changes from outside the router notify the listener', () => {
  const listener = vi.fn()
  const history = createRouterHistory({ mode: 'memory', listener })

  history.startListening()
  history.push('/foo')

  expect(listener).toHaveBeenCalledOnce()
})

test('refresh notifies the listener', () => {
  const listener = vi.fn()
  const history = createRouterHistory({ mode: 'memory', listener })

  history.startListening()
  history.refresh()

  expect(listener).toHaveBeenCalledOnce()
})

test('a superseded traversal cannot restore its old entry', async () => {
  const pending = Promise.withResolvers<boolean>()
  const listener = vi.fn(() => pending.promise)
  const history = createRouterHistory({ mode: 'memory', listener })
  history.startListening()
  history.update('/first')
  history.update('/second')
  history.back()

  history.update('/third')
  const current = history.location
  pending.resolve(false)
  await flushPromises()

  expect(history.location).toBe(current)
  history.stopListening()
})

test('stopping history listening invalidates pending restoration', async () => {
  const pending = Promise.withResolvers<boolean>()
  const listener = vi.fn(() => pending.promise)
  const history = createRouterHistory({ mode: 'memory', listener })
  history.startListening()
  history.update('/first')
  history.update('/second')
  history.back()
  const current = history.location

  history.stopListening()
  pending.resolve(false)
  await flushPromises()

  expect(history.location).toBe(current)
})
