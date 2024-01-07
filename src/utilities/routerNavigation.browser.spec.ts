import { describe, expect, test, vi } from 'vitest'
import { createRouterNavigation } from '@/utilities/routerNavigation'
import { random } from '@/utilities/testHelpers'
import * as utilities from '@/utilities/updateBrowserUrl'

describe('createRouterNavigation', () => {
  test('when go is called, forwards call to window history', () => {
    vi.spyOn(window.history, 'go')

    const onLocationUpdate = vi.fn()
    const delta = random.number({ min: 0, max: 100 })
    const history = createRouterNavigation({ onLocationUpdate })

    history.go(delta)

    expect(window.history.go).toHaveBeenCalledWith(delta)
  })

  test('when back is called, forwards call to window history', () => {
    vi.spyOn(window.history, 'back')

    const onLocationUpdate = vi.fn()
    const history = createRouterNavigation({ onLocationUpdate })

    history.back()

    expect(window.history.back).toHaveBeenCalledOnce()
  })

  test('when forward is called, forwards call to window history', () => {
    vi.spyOn(window.history, 'forward')

    const onLocationUpdate = vi.fn()
    const history = createRouterNavigation({ onLocationUpdate })

    history.forward()

    expect(window.history.forward).toHaveBeenCalledOnce()
  })

  test('when update is called, calls updateBrowserUrl', () => {
    vi.spyOn(utilities, 'updateBrowserUrl')

    const onLocationUpdate = vi.fn()
    const url = random.number().toString()
    const history = createRouterNavigation({ onLocationUpdate })

    history.update(url)

    expect(utilities.updateBrowserUrl).toHaveBeenCalledWith(url, undefined)
  })

  test('when update is called and same origin calls onLocationUpdate', async () => {
    vi.spyOn(utilities, 'isSameOrigin').mockReturnValue(true)

    const onLocationUpdate = vi.fn()
    const url = random.number().toString()
    const history = createRouterNavigation({ onLocationUpdate })

    await history.update(url)

    expect(onLocationUpdate).toHaveBeenCalledWith(url)
  })

  test('when update is called and not same origin does not call onLocationUpdate ', () => {
    const onLocationUpdate = vi.fn()
    vi.spyOn(utilities, 'isSameOrigin').mockReturnValue(true)

    const url = random.number().toString()
    const history = createRouterNavigation({ onLocationUpdate })

    history.update(url)

    expect(onLocationUpdate).not.toHaveBeenCalled()
  })
})