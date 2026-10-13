declare module 'virtual:kitbag-loader-macros' {
  import type { PrefetchConfig } from '@kitbag/router'
  export function defineLoader<T>(load: () => T, options?: { prefetch?: PrefetchConfig }): Promise<Awaited<T>>
}

declare module '*.mjs'
