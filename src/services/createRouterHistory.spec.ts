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
