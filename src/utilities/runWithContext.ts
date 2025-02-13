import { App } from "vue"

export function runWithContext<T>(callback: () => T, app: App | null): T {
  if (!app) {
    return callback()
  }

  return app.runWithContext(callback)
}