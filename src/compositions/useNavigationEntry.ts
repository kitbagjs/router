import { computed, inject, InjectionKey, Ref } from 'vue'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { NavigationEntry } from '@/services/createRouterNavigation'
import { createUseRouterNavigation } from '@/compositions/useRouterNavigation'
import { Router } from '@/types/router'

export const getNavigationEntryKey = createRouterKeyStore<Readonly<Ref<NavigationEntry | null>>>()

/**
 * Components rendered by RouterView use its entry. Consumers outside a view use the underlying route.
 * This does not change the route exposed by useRoute.
 */
export function createUseNavigationEntry(routerKey: InjectionKey<Router>): () => Readonly<Ref<NavigationEntry | null>> {
  const useRouterNavigation = createUseRouterNavigation(routerKey)

  return () => {
    const navigation = useRouterNavigation()

    return inject(getNavigationEntryKey(routerKey), computed(() => navigation.entries.route))
  }
}
