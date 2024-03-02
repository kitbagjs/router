import { expect, test, vi } from 'vitest'
import { createRouterNavigation } from '@/utilities/routerNavigation'
import { random } from '@/utilities/testHelpers'

test('when go is called, forwards call to window history', () => {
  vi.spyOn(window.history, 'go')

  const onAfterLocationUpdate = vi.fn()
  const delta = random.number({ min: 0, max: 100 })
  const history = createRouterNavigation({ onAfterLocationUpdate })

  history.go(delta)

  expect(window.history.go).toHaveBeenCalledWith(delta)
})

test('when back is called, forwards call to window history', () => {
  vi.spyOn(window.history, 'go')

  const onAfterLocationUpdate = vi.fn()
  const history = createRouterNavigation({ onAfterLocationUpdate })

  history.back()

  expect(window.history.go).toHaveBeenCalledOnce()
})

test('when forward is called, forwards call to window history', () => {
  vi.spyOn(window.history, 'go')

  const onAfterLocationUpdate = vi.fn()
  const history = createRouterNavigation({ onAfterLocationUpdate })

  history.forward()

  expect(window.history.go).toHaveBeenCalledOnce()
})

test('when update is called and same origin calls location hooks', async () => {
  const onBeforeLocationUpdate = vi.fn(() => Promise.resolve(true))
  const onAfterLocationUpdate = vi.fn()
  const url = random.number().toString()
  const history = createRouterNavigation({ onBeforeLocationUpdate, onAfterLocationUpdate })

  await history.update(url)

  expect(onBeforeLocationUpdate).toHaveBeenCalled()
  expect(onAfterLocationUpdate).toHaveBeenCalled()
})