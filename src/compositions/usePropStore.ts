import { inject } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { PropStore, propStoreKey } from '@/services/createPropStore'

export function usePropStore(): PropStore {
  const store = inject(propStoreKey)

  if (!store) {
    throw new RouterNotInstalledError()
  }

  return store
}