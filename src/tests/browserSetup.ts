import { afterEach, beforeEach, vi } from 'vitest'
import { mockNavigation } from '@/tests/mockNavigation'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  mockNavigation()
})

afterEach(() => {
  vi.unstubAllGlobals()
})
