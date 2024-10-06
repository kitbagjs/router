import { inject } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { PropStore, propStoreKey } from '@/models/PropStore'

export function usePropStore(): PropStore {
  const store = inject(propStoreKey)

  if (!store) {
    throw new RouterNotInstalledError()
  }

  return store
}