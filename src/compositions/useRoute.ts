import { useRouter } from '@/compositions/useRouter'
import { UseRouteInvalidError } from '@/errors'
import { ResolvedRoute, RouterRoute } from '@/types'

export function useRoute<TRoute extends RouterRoute>(routeName: TRoute['name']): ResolvedRoute<TRoute>
export function useRoute(routeName: 'string'): ResolvedRoute {
  const router = useRouter()
  const route = router.find(routeName)

  if (!route || route.name !== routeName) {
    throw new UseRouteInvalidError(routeName, router.route.name)
  }

  return route
}