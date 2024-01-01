import { RouterHistory } from '@/types'
import { createHistoryStateKey } from '@/utilities/historyStateKey'
import { getWindow } from '@/utilities/window'

export function createWebHistory(): RouterHistory {
  const historyStateKey = createHistoryStateKey()
  const items: unknown[] = []
  let state: unknown = null

  function handlePopState(): void {
    // check if new location is different, if so navigate back to it
  }

  function init(): void {
    const window = getWindow()

    state = getUpdatedState({}, true)
    items.push(state)

    window.addEventListener('popstate', handlePopState)
  }

  function dispose(): void {
    getWindow().removeEventListener('popstate', handlePopState)
  }

  function go(delta: number): void {
    getWindow().history.go(delta)
  }

  function back(): void {
    return go(-1)
  }

  function forward(): void {
    return go(+1)
  }

  function pushState(data: unknown, url?: string | URL | null): void {
    const window = getWindow()
    items.push(data)

    try {
      state = getUpdatedState(data)
      window.history.pushState(state, '', url)
    } catch {
      window.location.assign(url ?? '')
    }
  }

  function replaceState(data: unknown, url?: string | URL | null): void {
    const window = getWindow()

    try {
      state = getUpdatedState(data)
      window.history.replaceState(state, '', url)
    } catch {
      window.location.replace(url ?? '')
    }
  }

  function getUpdatedState(data: unknown, replace = false): unknown {
    if (replace) {
      return Object.assign({}, window.history.state, data, { key: historyStateKey.get() })
    }

    return Object.assign({}, data, { key: historyStateKey.next() })
  }

  init()

  return new Proxy({
    length,
    state,
    dispose,
    go,
    back,
    forward,
    pushState,
    replaceState,
  }, {
    get: (target, prop) => {
      if (prop === 'length') {
        return items.length
      }

      if (prop === 'state') {
        return state
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return target[prop]
    },
  })
}