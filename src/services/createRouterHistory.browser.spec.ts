import { beforeEach, expect, test, vi } from 'vitest'
import { createRouterHistory } from '@/services/createRouterHistory'
import { random } from '@/utilities/testHelpers'

function noop(): void {}

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
