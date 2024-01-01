import { RouterHistory } from '@/types'
import { HistoryStateKey } from '@/utilities/historyStateKey'
import { getWindow } from '@/utilities/window'

export function createWebHistory(): RouterHistory {
  const items: unknown[] = []
  const state: unknown = null

  function handlePopState(event: PopStateEvent): void {
    console.log('popstate', event)
  }

  getWindow().addEventListener('popstate', handlePopState)

  function dispose(): void {
    getWindow().removeEventListener('popstate', handlePopState)
  }

  function go(): void {

  }

  function back(): void {

  }

  function forward(): void {

  }

  function pushState(data: unknown, url?: string | URL | null): void {
    const window = getWindow()
    items.push(data)

    try {
      const state = { key: HistoryStateKey.next() }
      window.history.pushState(state, '', url)
    } catch {
      window.location.assign(url ?? '')
    }
  }

  function replaceState(data: unknown, url?: string | URL | null): void {
    const window = getWindow()

    try {
      const state = Object.assign({}, window.history.state, { key: HistoryStateKey.get() })
      window.history.replaceState(state, '', url)
    } catch {
      window.location.replace(url ?? '')
    }
  }

  return new Proxy({
    length: items.length,
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

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return target[prop]
    },
  })
}