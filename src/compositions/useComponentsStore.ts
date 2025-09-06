import { inject, InjectionKey } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { ComponentsStore } from '@/services/createComponentsStore'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router } from '@/types/router'

export const getComponentsStoreKey = createRouterKeyStore<ComponentsStore>()

export function createUseComponentsStore<TRouter extends Router>(routerKey: InjectionKey<TRouter>) {
  const componentsStoreKey = getComponentsStoreKey(routerKey)

  return () => {
    const store = inject(componentsStoreKey)

    if (!store) {
      throw new RouterNotInstalledError()
    }

    return store
  }
}
