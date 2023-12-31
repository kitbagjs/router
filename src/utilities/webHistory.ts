import { RouterHistory } from '@/types'
import { HistoryStateKey } from '@/utilities/historyStateKey'
import { getWindow } from '@/utilities/window'

export class WebHistory implements RouterHistory {
  public items: unknown[] = []
  public readonly state: unknown = null

  private handlePopState(event: PopStateEvent): void {
    console.log('popstate', event)
  }

  public constructor() {
    getWindow().addEventListener('popstate', this.handlePopState)
  }

  public dispose(): void {
    getWindow().removeEventListener('popstate', this.handlePopState)
  }

  public go(): void {

  }

  public back(): void {

  }

  public forward(): void {

  }

  public pushState(): void {
    const window = getWindow()
    const url = '' // not implemented

    try {
      const state = { key: HistoryStateKey.next() }
      window.history.pushState(state, '', url)
    } catch {
      window.location.assign(url)
    }
  }

  public replaceState(): void {
    const window = getWindow()
    const url = '' // not implemented

    try {
      const state = Object.assign({}, window.history.state, { key: HistoryStateKey.get() })
      window.history.replaceState(state, '', url)
    } catch {
      window.location.replace(url)
    }
  }

  public get length(): number {
    return this.items.length
  }
}