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

test('a superseded traversal cannot restore or accept its old entry', () => {
  const listener = vi.fn()
  const history = createRouterHistory({ mode: 'memory', listener })
  history.startListening()
  history.update('/first')
  history.update('/second')
  history.back()
  const { traversal } = listener.mock.calls[0][0]

  history.update('/third')
  const current = history.location
  traversal.restore()
  traversal.commit()

  expect(history.location).toBe(current)
  history.stopListening()
})

test('stopping history listening invalidates pending restoration', () => {
  const listener = vi.fn()
  const history = createRouterHistory({ mode: 'memory', listener })
  history.startListening()
  history.update('/first')
  history.update('/second')
  history.back()
  const { traversal } = listener.mock.calls[0][0]
  const current = history.location

  history.stopListening()
  traversal.restore()

  expect(history.location).toBe(current)
})
