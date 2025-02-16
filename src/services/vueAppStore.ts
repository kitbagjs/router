import { App } from 'vue'

class VueAppStore {
  private instance: App | null = null

  public setApp(app: App): void {
    this.instance = app
  }

  public get app(): App | null {
    return this.instance
  }

  public runWithContext<T>(callback: () => T): T {
    if (!this.instance) {
      return callback()
    }

    return this.instance.runWithContext(callback)
  }
}

export const vueAppStore = new VueAppStore()
