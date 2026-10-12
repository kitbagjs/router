import { InjectionKey, inject } from 'vue'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Router, RouterRoutes } from '@/types/router'
import { RouterViewTransition } from '@/types/viewTransition'

export const getViewTransitionKey = createRouterKeyStore<RouterViewTransition>()

export function createUseViewTransition<TRouter extends Router>(routerKey: InjectionKey<TRouter>): () => RouterViewTransition<RouterRoutes<TRouter>>
export function createUseViewTransition(routerKey: InjectionKey<Router>): () => RouterViewTransition {
  const transitionKey = getViewTransitionKey(routerKey)

  return () => {
    const transition = inject(transitionKey)

    if (!transition) {
      throw new RouterNotInstalledError()
    }

    return transition
  }
}
