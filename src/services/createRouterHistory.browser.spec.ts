import { flushPromises } from '@vue/test-utils'
import { beforeEach, expect, test, vi } from 'vitest'
import { createRouterHistory } from '@/services/createRouterHistory'
import { random } from '@/utilities/testHelpers'

function noop(): undefined {}

beforeEach(() => vi.resetAllMocks())

test('when go is called, forwards call to window history', () => {
  vi.spyOn(window.history, 'go')

  const delta = random.number({ min: 0, max: 100 })
  const history = createRouterHistory({ listener: noop })

  history.go(delta)

  expect(window.history.go).toHaveBeenCalledWith(delta)
})

test('when back is called, forwards call to window history', () => {
  vi.spyOn(window.history, 'go')

  const history = createRouterHistory({ listener: noop })

  history.back()

  expect(window.history.go).toHaveBeenCalledOnce()
})

test('when forward is called, forwards call to window history', () => {
  vi.spyOn(window.history, 'go')

  const history = createRouterHistory({ listener: noop })

  history.forward()

  expect(window.history.go).toHaveBeenCalledOnce()
})

test.each(['browser', 'hash'] as const)('restores an indexed %s entry without notifying the listener again', async (mode) => {
  window.history.replaceState(null, '', '/')
  const listener = vi.fn(() => false)
  const history = createRouterHistory({ mode, listener })
  history.startListening()
  history.update('/first', { state: { visit: 'first' } })
  const first = { url: window.location.href, state: window.history.state }
  history.update('/second', { state: { visit: 'second' } })
  const second = { url: window.location.href, state: window.history.state }
  const go = vi.spyOn(window.history, 'go').mockImplementation(() => {})

  window.history.replaceState(first.state, '', first.url)
  window.dispatchEvent(new PopStateEvent('popstate', { state: first.state }))
  await flushPromises()

  expect(go).toHaveBeenCalledOnce()
  expect(go).toHaveBeenCalledWith(1)
  window.history.replaceState(second.state, '', second.url)
  window.dispatchEvent(new PopStateEvent('popstate', { state: second.state }))

  expect(listener).toHaveBeenCalledOnce()
  expect(history.location.key).toBe(second.state.key)
  expect(history.location.state).toEqual({ visit: 'second' })
  history.stopListening()
  go.mockRestore()
})

test('does not guess a traversal distance for an entry without an index', async () => {
  window.history.replaceState(null, '', '/')
  const listener = vi.fn(() => false)
  const history = createRouterHistory({ mode: 'browser', listener })
  history.startListening()
  history.update('/first')
  const go = vi.spyOn(window.history, 'go').mockImplementation(() => {})

  window.history.replaceState({ key: 'external' }, '', '/external')
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
  await flushPromises()

  expect(go).not.toHaveBeenCalled()
  expect(window.location.pathname).toBe('/external')
  history.stopListening()
  go.mockRestore()
})
