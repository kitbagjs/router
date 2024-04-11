import { useRouter } from '@/compositions/useRouter'
import { UseRouteInvalidError } from '@/errors'
import { RegisteredRouteMap, ResolvedRoute } from '@/types'

export function useRoute<TRouteName extends keyof RegisteredRouteMap>(routeName: TRouteName): ResolvedRoute<TRouteName>
export function useRoute(routeName: string): ResolvedRoute {
  const router = useRouter()
  const route = router.find(routeName)

  if (!route || route.name !== routeName) {
    throw new UseRouteInvalidError(routeName, router.route.name)
  }

  return route
}