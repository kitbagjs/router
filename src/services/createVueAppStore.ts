import { App } from 'vue'

export type HasVueAppStore = {
  setVueApp: (app: App) => void,
}

type VueAppStore = HasVueAppStore & {
  runWithContext: <T>(callback: () => T) => T,
}

export function createVueAppStore(): VueAppStore {
  let instance: App | null = null

  function setVueApp(app: App): void {
    instance = app
  }

  function runWithContext<T>(callback: () => T): T {
    if (!instance) {
      return callback()
    }

    return instance.runWithContext(callback)
  }

  return {
    setVueApp,
    runWithContext,
  }
}
