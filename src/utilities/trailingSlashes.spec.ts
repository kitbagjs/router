import { describe, expect, test } from 'vitest'
import { pathHasTrailingSlash, removeTrailingSlashesFromPath } from './trailingSlashes'

describe('removeTrailingSlashesFromPath', () => {
  test('removes single trailing slash', () => {
    const url = '/foo/bar/'

    const response = removeTrailingSlashesFromPath(url)

    expect(response).toBe('/foo/bar')
  })

  test('removes multiple trailing slashes', () => {
    const url = '/foo/bar///'

    const response = removeTrailingSlashesFromPath(url)

    expect(response).toBe('/foo/bar')
  })

  test('does nothing if there are no trailing slashes', () => {
    const url = '/foo/bar'

    const response = removeTrailingSlashesFromPath(url)

    expect(response).toBe('/foo/bar')
  })

  test('does not remove duplicate slashes in the middle of the string', () => {
    const url = '/foo//bar/'

    const response = removeTrailingSlashesFromPath(url)

    expect(response).toBe('/foo//bar')
  })

  test('does not remove trailing slash that is the only character in the string', () => {
    const url = '/'

    const response = removeTrailingSlashesFromPath(url)

    expect(response).toBe('/')
  })

  test('removes trailing slash from path of full URL', () => {
    const url = 'https://kitbag.dev/foo/'

    const response = removeTrailingSlashesFromPath(url)

    expect(response).toBe('https://kitbag.dev/foo')
  })

  test('preserves root path for full URL (no trim)', () => {
    const url = 'https://kitbag.dev/'

    const response = removeTrailingSlashesFromPath(url)

    expect(response).toBe('https://kitbag.dev/')
  })

  test('preserves query and hash when removing trailing slash from full URL', () => {
    const url = 'https://kitbag.dev/foo/?a=1#section'

    const response = removeTrailingSlashesFromPath(url)

    expect(response).toBe('https://kitbag.dev/foo?a=1#section')
  })
})

describe('hasTrailingSlashes', () => {
  test('returns true if the string has a trailing slash', () => {
    const url = '/foo/bar/'

    const response = pathHasTrailingSlash(url)

    expect(response).toBe(true)
  })

  test('returns false if the string does not have a trailing slash', () => {
    const url = '/foo/bar'

    const response = pathHasTrailingSlash(url)

    expect(response).toBe(false)
  })

  test('returns false when the only character is a leading slash', () => {
    const url = '/'

    const response = pathHasTrailingSlash(url)

    expect(response).toBe(false)
  })

  test('returns true when full URL path has trailing slash', () => {
    const url = 'https://kitbag.dev/foo/'

    const response = pathHasTrailingSlash(url)

    expect(response).toBe(true)
  })

  test('returns false when full URL path is root', () => {
    const url = 'https://kitbag.dev/'

    const response = pathHasTrailingSlash(url)

    expect(response).toBe(false)
  })
})
