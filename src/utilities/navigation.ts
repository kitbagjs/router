import { NavigationBehavior } from '@/types/navigation'
import { ResolvedRoute } from '@/types/resolved'

type NavigationOptions = {
  routerNavigation?: NavigationBehavior,
  routeNavigation?: NavigationBehavior,
  navigation?: NavigationBehavior,
}

type NavigationOption = {
  navigation: NavigationBehavior,
  isBlockingNavigation: boolean,
  isProgressiveNavigation: boolean,
}

export function getRouteNavigationOption(to: ResolvedRoute | null): NavigationBehavior | undefined {
  return to?.matches.findLast((match) => match.navigation !== undefined)?.navigation
}

export function getNavigationOption(options: NavigationOptions): NavigationOption {
  const navigation = options.navigation ?? options.routeNavigation ?? options.routerNavigation ?? 'progressive'

  return {
    navigation,
    isBlockingNavigation: navigation === 'blocking',
    isProgressiveNavigation: navigation === 'progressive',
  }
}
