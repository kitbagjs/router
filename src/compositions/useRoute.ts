import { watch } from 'vue'
import { useRouter } from '@/compositions/useRouter'
import { UseRouteInvalidError } from '@/errors'
import { RegisteredRouteMap, RouterRoute } from '@/types'
import { combineName } from '@/utilities/combineName'

export function useRoute<TRouteKey extends string & keyof RegisteredRouteMap>(routeKey: TRouteKey): RouterRoute<RegisteredRouteMap[TRouteKey]>
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