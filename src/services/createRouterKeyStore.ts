import { Router } from '@/types/router'
import { InjectionKey } from 'vue'

export function createRouterKeyStore<TValue>() {
  const lookup = new Map<InjectionKey<Router>, InjectionKey<TValue>>()

  return (routerKey: InjectionKey<Router>): InjectionKey<TValue> => {
    const key = lookup.get(routerKey)

    if (!key) {
      const key = Symbol()

      lookup.set(routerKey, key)

      return key
    }

    return key
  }
}
