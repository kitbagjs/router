import { DeepReadonly, watch } from 'vue'
import { useRouter } from '@/compositions/useRouter'
import { UseRouteInvalidError } from '@/errors'
import { RegisteredRouteMap, ResolvedRoute } from '@/types'
import { combineName } from '@/utilities/combineName'

export function useRoute<TRouteName extends keyof RegisteredRouteMap>(routeName: TRouteName): DeepReadonly<ResolvedRoute<TRouteName>>
export function useRoute(): DeepReadonly<ResolvedRoute>
export function useRoute(routeName?: string): DeepReadonly<ResolvedRoute> {
  const router = useRouter()

  function checkRouteNameIsValid(): void {
    if (!routeName) {
      return
    }

    const routeNames = router.route.matches.map(route => route.name)
    const routeAncestryNames = getRouteDotNotationNames(routeNames)
    const routeNameIsValid = routeAncestryNames.includes(routeName)

    if (!routeNameIsValid) {
      throw new UseRouteInvalidError(routeName, router.route.name)
    }
  }

  watch(router.route, checkRouteNameIsValid, { immediate: true, deep: true })

  return router.route
}

function getRouteDotNotationNames(names: (string | undefined)[]): string[] {
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