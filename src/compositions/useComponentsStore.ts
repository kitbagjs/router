import { inject, InjectionKey } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { ComponentsStore } from '@/services/createComponentsStore'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { routerInjectionKey } from './useRouter'
import { Router } from '@/types/router'

export const getComponentsStoreKey = createRouterKeyStore<ComponentsStore>()

export const componentsStoreKey = getComponentsStoreKey(routerInjectionKey)

export function createUseComponentsStore<TRouter extends Router>(key: InjectionKey<TRouter>) {
  const componentsStoreKey = getComponentsStoreKey(key)

  return () => {
    const store = inject(componentsStoreKey)

    if (!store) {
      throw new RouterNotInstalledError()
    }

    return store
  }
}

export const useComponentsStore = createUseComponentsStore(routerInjectionKey)
