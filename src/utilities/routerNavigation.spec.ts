import { describe, expect, test } from 'vitest'
import { createRouterNavigation } from '@/utilities/routerNavigation'

describe('createRouterNavigation', () => {
  test('is not implemented, and throws exception', () => {
    expect(() => createRouterNavigation()).toThrowError('not implemented')
  })
})