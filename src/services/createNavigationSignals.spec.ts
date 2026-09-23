import { describe, expect, test } from 'vitest'
import { createNavigationSignals } from '@/services/createNavigationSignals'

describe('createNavigationSignals', () => {
  test('beginning a navigation aborts the one before it', () => {
    const { begin } = createNavigationSignals()

    const first = begin()
    const second = begin()

    expect(first.signal.aborted).toBe(true)
    expect(second.signal.aborted).toBe(false)
  })

  test('stopping aborts the navigation under way', () => {
    const { begin, stop } = createNavigationSignals()

    const { signal } = begin()

    stop()

    expect(signal.aborted).toBe(true)
  })

  test('a navigation begun after stopping is already aborted', () => {
    const { begin, stop } = createNavigationSignals()

    stop()

    expect(begin().signal.aborted).toBe(true)
  })
})
