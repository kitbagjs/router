import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest'
import * as isBrowser from '@/utilities/isBrowser'
import { createRouterNavigation } from '@/utilities/routerNavigation'
import { random } from '@/utilities/testHelpers'
import * as utilities from '@/utilities/updateBrowserUrl'

describe('createRouterNavigation', () => {
  describe('when isBrowser is true', () => {
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

  describe('when isBrowser is false', () => {
    beforeEach(() => {
      vi.spyOn(isBrowser, 'isBrowser').mockImplementation(() => false)
    })
    afterEach(() => {
      vi.restoreAllMocks()
    })

    test('when go is called, does nothing', () => {
      vi.spyOn(window.history, 'go')

      const delta = random.number({ min: 0, max: 100 })
      const history = createRouterNavigation()

      history.go(delta)

      expect(window.history.go).toHaveBeenCalledTimes(0)
    })

    test('when back is called, does nothing', () => {
      vi.spyOn(window.history, 'back')

      const history = createRouterNavigation()

      history.back()

      expect(window.history.back).toHaveBeenCalledTimes(0)
    })

    test('when forward is called, does nothing', () => {
      vi.spyOn(window.history, 'forward')

      const history = createRouterNavigation()

      history.forward()

      expect(window.history.forward).toHaveBeenCalledTimes(0)
    })

    test('when update is called, calls updateBrowserUrl', () => {
      vi.spyOn(utilities, 'updateBrowserUrl')

      const url = random.number().toString()
      const history = createRouterNavigation()

      history.update(url)

      expect(utilities.updateBrowserUrl).toHaveBeenCalledWith(url)
    })
  })
})