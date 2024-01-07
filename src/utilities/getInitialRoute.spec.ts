import { describe, expect, test } from 'vitest'
import { createRouter } from '@/utilities/createRouter'

describe('getInitialRoute', () => {
  test('throws error if initial route is not set', () => {
    expect(() => createRouter([])).toThrowError('initialUrl must be set if window.location is unavailable')
  })
})