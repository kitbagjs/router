// @vitest-environment happy-dom

import { describe, expect, test } from 'vitest'
import { createWebHistory } from '@/utilities/webHistory'

describe('webHistory', () => {
  test('when new history is created, length should start at 1', () => {
    const history = createWebHistory()

    expect(history.length).toBe(1)
  })

  test('if new state is pushed, length is increased', () => {
    const history = createWebHistory()

    history.pushState({}, 'does-not-matter')

    expect(history.length).toBe(2)
  })
})