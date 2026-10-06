import { NavigationBehavior } from '@/types/navigation'

type NavigationOptions = {
  routerNavigation?: NavigationBehavior,
  routeNavigation?: NavigationBehavior,
  navigation?: NavigationBehavior,
}

export function getNavigationOption({ routerNavigation, routeNavigation, navigation }: NavigationOptions): NavigationBehavior {
  return navigation ?? routeNavigation ?? routerNavigation ?? 'progressive'
}
