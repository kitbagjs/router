import { computed, inject, InjectionKey, ShallowRef } from 'vue'
import { ResolvedRoute } from '@/types/resolved'
import { Router } from '@/types/router'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { isRouterRoute } from '@/services/createRouterRoute'
import { createUseRouter } from './useRouter'

export const getViewRouteInjectionKey = createRouterKeyStore<ShallowRef<ResolvedRoute>>()

export function createUseViewRoute(routerKey: InjectionKey<Router>): () => ShallowRef<ResolvedRoute> {
  const useRouter = createUseRouter(routerKey)
  const key = getViewRouteInjectionKey(routerKey)

  return () => {
    const inherited = inject(key, undefined)

    if (inherited) {
      return inherited
    }

    const router = useRouter()
    const route = router.route

    if (!isRouterRoute(routerKey, route)) {
      throw new TypeError('Expected a router route for this router')
    }

    return computed(() => route.getResolvedRoute())
  }
}
