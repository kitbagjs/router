import { describe, expect, test } from 'vitest'
import { createNavigationIds } from '@/services/createNavigationIds'

describe('createNavigationIds', () => {
  test('each navigation id is unique', () => {
    const { getNavigationId } = createNavigationIds()

    expect(getNavigationId()).not.toBe(getNavigationId())
  })

  test('only the most recent navigation id is current', () => {
    const { getNavigationId, isCurrentNavigationId } = createNavigationIds()

    const first = getNavigationId()

    expect(isCurrentNavigationId(first)).toBe(true)

    const second = getNavigationId()

    expect(isCurrentNavigationId(first)).toBe(false)
    expect(isCurrentNavigationId(second)).toBe(true)
  })

  test('given an id that was never issued, is not current', () => {
    const { getNavigationId, isCurrentNavigationId } = createNavigationIds()

    getNavigationId()

    expect(isCurrentNavigationId('unknown')).toBe(false)
  })

  test('after stop, no navigation id is current', () => {
    const { getNavigationId, isCurrentNavigationId, stop } = createNavigationIds()

    const before = getNavigationId()

    stop()

    const after = getNavigationId()

    expect(isCurrentNavigationId(before)).toBe(false)
    expect(isCurrentNavigationId(after)).toBe(false)
  })
})
