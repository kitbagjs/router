import { inject, InjectionKey, Ref } from 'vue'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { NavigationEntry } from '@/services/createRouterNavigation'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { Router } from '@/types/router'

export const getNavigationEntryKey = createRouterKeyStore<Readonly<Ref<NavigationEntry | null>>>()

/**
 * RouterView provides the entry it renders. At the app level, the router provides the underlying entry.
 */
export function createUseNavigationEntry(routerKey: InjectionKey<Router>): () => Readonly<Ref<NavigationEntry | null>> {
  return () => {
    const entry = inject(getNavigationEntryKey(routerKey))

    if (!entry) {
      throw new RouterNotInstalledError()
    }

    return entry
  }
}
