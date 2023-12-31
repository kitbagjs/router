// @vitest-environment happy-dom

import { expect, test, vi } from 'vitest'
import { updateWindowLocation } from '@/utilities/updateWindowLocation'

test('updates the window location', () => {
  vi.spyOn(window.location, 'assign')

  updateWindowLocation('/foo')

  expect(window.location.assign).toHaveBeenCalled()
})

test('updates the window location using replace when options.replace is true', () => {
  vi.spyOn(window.location, 'replace')

  updateWindowLocation('/foo', { replace: true })

  expect(window.location.replace).toHaveBeenCalled()
})