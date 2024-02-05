import { describe, expect, test } from 'vitest'
import { hasProperty } from '@/utilities/guards'

describe('hasProperty', () => {

  test('returns true when property exists', () => {
    const source = hasProperty({ foo: true }, 'foo')

    expect(source).toBe(true)
  })

  test('returns false when property does not exists', () => {
    const source = hasProperty({}, 'foo')

    expect(source).toBe(false)
  })

  test('returns true when property exists and is correct type', () => {
    const source = hasProperty({ foo: true }, 'foo', Boolean)

    expect(source).toBe(true)
  })

  test('returns false when property exists and is not correct type', () => {
    const source = hasProperty({ foo: true }, 'foo', String)

    expect(source).toBe(false)
  })

})