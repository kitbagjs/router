import { expect, test, vi } from 'vitest'
import { createRouterNavigation } from '@/utilities/routerNavigation'
import { random } from '@/utilities/testHelpers'
import * as utilities from '@/utilities/updateBrowserUrl'

test('when go is called, forwards call to window history', () => {
  vi.spyOn(window.history, 'go')

  const onAfterLocationUpdate = vi.fn()
  const delta = random.number({ min: 0, max: 100 })
  const history = createRouterNavigation({ onAfterLocationUpdate })

  history.go(delta)

  expect(window.history.go).toHaveBeenCalledWith(delta)
})

test('when back is called, forwards call to window history', () => {
  vi.spyOn(window.history, 'back')

  const onAfterLocationUpdate = vi.fn()
  const history = createRouterNavigation({ onAfterLocationUpdate })

  history.back()

  expect(window.history.back).toHaveBeenCalledOnce()
})

test('when forward is called, forwards call to window history', () => {
  vi.spyOn(window.history, 'forward')

  const onAfterLocationUpdate = vi.fn()
  const history = createRouterNavigation({ onAfterLocationUpdate })

  history.forward()

  expect(window.history.forward).toHaveBeenCalledOnce()
})

test('when update is called, calls updateBrowserUrl', () => {
  vi.spyOn(utilities, 'updateBrowserUrl')

  const onAfterLocationUpdate = vi.fn()
  const url = random.number().toString()
  const history = createRouterNavigation({ onAfterLocationUpdate })

  history.update(url)

  expect(utilities.updateBrowserUrl).toHaveBeenCalledWith(url, undefined)
})

test('when update is called and same origin calls onAfterLocationUpdate', async () => {
  vi.spyOn(utilities, 'isSameOrigin').mockReturnValue(true)

  const onAfterLocationUpdate = vi.fn()
  const url = random.number().toString()
  const history = createRouterNavigation({ onAfterLocationUpdate })

  await history.update(url)

  expect(onAfterLocationUpdate).toHaveBeenCalledWith(url)
})

test('when update is called and not same origin does not call onAfterLocationUpdate ', () => {
  const onAfterLocationUpdate = vi.fn()
  vi.spyOn(utilities, 'isSameOrigin').mockReturnValue(true)

  const url = random.number().toString()
  const history = createRouterNavigation({ onAfterLocationUpdate })

  history.update(url)

  expect(onAfterLocationUpdate).not.toHaveBeenCalled()
})