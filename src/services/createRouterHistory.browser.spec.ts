import { expect, test, vi } from 'vitest'
import { createRouterHistory } from '@/services/createRouterHistory'
import { PreparedNavigation } from '@/types/routerHistory'
import { mockNavigation } from '@/tests/mockNavigation'

async function prepare(): Promise<PreparedNavigation> {
  return { signal: new AbortController().signal, commit: async () => {} }
}

test('auto selects the Navigation API in a browser', async () => {
  const native = mockNavigation()
  const history = createRouterHistory({ prepare })

  await history.push('/first')

  expect(native.navigate).toHaveBeenCalledWith('/first', { history: 'push', state: undefined })
})

test('explicit memory mode uses memory even when the browser API is available', async () => {
  const native = mockNavigation()
  const history = createRouterHistory({ mode: 'memory', prepare })

  await history.push('/first')

  expect(history.location.pathname).toBe('/first')
  expect(window.location.pathname).toBe('/')
  expect(native.navigate).not.toHaveBeenCalled()
})

test('explicit hash mode retains hash navigation', async () => {
  const native = mockNavigation()
  const history = createRouterHistory({ mode: 'hash', prepare })

  await history.push('/first')

  expect(window.location.hash).toBe('#/first')
  expect(native.navigate).not.toHaveBeenCalled()
})

test('go traverses to the native entry key', async () => {
  const native = mockNavigation()
  const traverse = vi.spyOn(native, 'traverseTo')
  const history = createRouterHistory({ prepare })

  await history.push('/first')
  const first = native.currentEntry

  await history.push('/second')
  history.go(-1)

  expect(traverse).toHaveBeenCalledWith(first.key)
})

test('back and forward use native traversal methods', async () => {
  const native = mockNavigation()
  const back = vi.spyOn(native, 'back')
  const forward = vi.spyOn(native, 'forward')
  const history = createRouterHistory({ prepare })

  await history.push('/first')
  await history.push('/second')
  history.back()
  await back.mock.results[0].value.finished
  history.forward()

  expect(back).toHaveBeenCalledOnce()
  expect(forward).toHaveBeenCalledOnce()
})
