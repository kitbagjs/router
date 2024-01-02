
import { expect, test, vi } from 'vitest'
import { updateBrowserUrl } from '@/utilities/updateBrowserUrl'

test('updates the window location', () => {
  vi.spyOn(window.location, 'assign').mockImplementation(() => {})

  updateBrowserUrl('http://example.com2/foo')

  expect(window.location.assign).toHaveBeenCalled()
})

test('updates the window location using replace when options.replace is true', () => {
  vi.spyOn(window.location, 'replace').mockImplementation(() => {})

  updateBrowserUrl('http://example.com/foo', { replace: true })

  expect(window.location.replace).toHaveBeenCalled()
})

test('updates the history', () => {
  vi.spyOn(history, 'pushState').mockImplementation(() => {})

  updateBrowserUrl('/foo')

  expect(history.pushState).toHaveBeenCalled()
})

test('updates the history using replaceState when options.replace is true', () => {
  vi.spyOn(history, 'replaceState').mockImplementation(() => {})

  updateBrowserUrl('/foo', { replace: true })

  expect(history.replaceState).toHaveBeenCalled()
})