import { inject } from 'vue'
import { PropStore, propStoreKey } from '@/models/PropStore'

export function usePropStore(): PropStore {
  const store = inject(propStoreKey)

  if (!store) {
    throw 'PropStore not provided!'
  }

  return store
}