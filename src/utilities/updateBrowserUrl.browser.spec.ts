
import { expect, test, vi } from 'vitest'
import { updateBrowserUrl } from '@/utilities/updateBrowserUrl'

test('updates the window location', () => {
  vi.spyOn(window.location, 'assign').mockImplementation(() => {})
  const url = 'http://example.com2/foo'

  updateBrowserUrl(url)

  expect(window.location.assign).toHaveBeenCalledWith(url)
})

test('updates the window location using replace when options.replace is true', () => {
  vi.spyOn(window.location, 'replace').mockImplementation(() => {})

  const url = 'http://example.com/foo'

  updateBrowserUrl(url, { replace: true })

  expect(window.location.replace).toHaveBeenCalledWith(url)
})

test('updates the history', () => {
  vi.spyOn(history, 'pushState').mockImplementation(() => {})

  const url = '/foo'

  updateBrowserUrl(url)

  expect(history.pushState).toHaveBeenCalledWith({}, '', url)
})

test('updates the history using replaceState when options.replace is true', () => {
  vi.spyOn(history, 'replaceState').mockImplementation(() => {})

  const url = '/foo'

  updateBrowserUrl(url, { replace: true })

  expect(history.replaceState).toHaveBeenCalledWith({}, '', url)
})