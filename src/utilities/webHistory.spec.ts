// @vitest-environment happy-dom

import { fireEvent } from '@testing-library/dom'
import { afterEach, describe, expect, test } from 'vitest'
import { RouterHistory } from '@/types'
import { createWebHistory } from '@/utilities/webHistory'

let history: RouterHistory | undefined = undefined

afterEach(() => history?.dispose())

function simulateBrowserBack(): void {
  fireEvent(window, new Event('popstate'))
  window.location.replace('/different')
}

describe('webHistory', () => {
  test('when new history is created, length should start at 1', () => {
    history = createWebHistory()

    expect(history.length).toBe(1)
  })

  test('if new state is pushed, length is increased', () => {
    history = createWebHistory()

    history.pushState({}, 'does-not-matter')

    expect(history.length).toBe(2)
  })

  test('if back button is pushed, length stays the same but state changes', () => {
    history = createWebHistory()

    const initialState = Object.assign({}, history.state)
    history.pushState({}, 'does-not-matter')

    expect(history.state).not.toMatchObject(initialState)

    simulateBrowserBack()

    expect(history.length).toBe(2)
    expect(history.state).toMatchObject(initialState)
  })
})