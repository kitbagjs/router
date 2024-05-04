import { watch } from 'vue'
import { useRouter } from '@/compositions/useRouter'
import { UseRouteInvalidError } from '@/errors'
import { combineName } from '@/services/combineName'
import { RouterRoute } from '@/services/createRouterRoute'
import { RegisteredRouteMap } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'

export function useRoute<TRouteKey extends string & keyof RegisteredRouteMap>(routeKey: TRouteKey): RouterRoute<ResolvedRoute<RegisteredRouteMap[TRouteKey]>>
export function useRoute(): RouterRoute
export function useRoute(routeKey?: string): RouterRoute {
  const router = useRouter()

  function checkRouteKeyIsValid(): void {
    if (!routeKey) {
      return
    }

    const actualRouteKeys = router.route.matches.map(route => route.name)
    const actualRouteKey = getRouteKey(actualRouteKeys)
    const routeKeyIsValid = actualRouteKey.includes(routeKey)

    if (!routeKeyIsValid) {
      throw new UseRouteInvalidError(routeKey, router.route.key)
    }
  }

  watch(router.route, checkRouteKeyIsValid, { immediate: true, deep: true })

  return router.route
}

function getRouteKey(names: (string | undefined)[]): string[] {
  return names.reduce<string[]>((ancestorNames, name) => {
    const previous = ancestorNames.pop()
    const next = name ? [combineName(previous, name)] : []

    if (!previous) {
      return next
    }

    return [
      ...ancestorNames,
      previous,
      ...next,
    ]
  }, [])
}