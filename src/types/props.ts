import { CreatedRouteOptions, RouteLoadersOf } from '@/types/route'
import { GetData } from '@/types/routeLoaders'
import { GetProps } from '@/types/routeViews'
import { LastInArray } from '@/types/utilities'

export type ParentContext<TParentMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]> = {
  name: LastInArray<TParentMatches>['name'],
  getData: GetData<RouteLoadersOf<TParentMatches>>,
  getProps: GetProps<LastInArray<TParentMatches>['views']>,
}
