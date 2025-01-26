import { inject } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { ComponentsStore, componentsStoreKey } from '@/services/createComponentsStore'

export function useComponentsStore(): ComponentsStore {
  const store = inject(componentsStoreKey)

  if (!store) {
    throw new RouterNotInstalledError()
  }

  return store
}
