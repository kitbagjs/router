import { describe, expect, test, vi } from 'vitest'
import { createRouterNavigation } from '@/utilities/routerNavigation'
import { random } from '@/utilities/testHelpers'
import * as utilities from '@/utilities/updateBrowserUrl'

describe('createRouterNavigation', () => {
  test('when go is called, forwards call to window history', () => {
    vi.spyOn(window.history, 'go')

    const delta = random.number({ min: 0, max: 100 })
    const history = createRouterNavigation()

    history.go(delta)

    expect(window.history.go).toHaveBeenCalledWith(delta)
  })

  test('when back is called, forwards call to window history', () => {
    vi.spyOn(window.history, 'back')

    const history = createRouterNavigation()

    history.back()

    expect(window.history.back).toHaveBeenCalledOnce()
  })

  test('when forward is called, forwards call to window history', () => {
    vi.spyOn(window.history, 'forward')

    const history = createRouterNavigation()

    history.forward()

    expect(window.history.forward).toHaveBeenCalledOnce()
  })

  test('when update is called, calls updateBrowserUrl', () => {
    vi.spyOn(utilities, 'updateBrowserUrl')

    const url = random.number().toString()
    const history = createRouterNavigation()

    history.update(url)

    expect(utilities.updateBrowserUrl).toHaveBeenCalledWith(url)
  })
})