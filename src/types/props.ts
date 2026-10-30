import { Route, RouteLoadersOf } from '@/types/route'
import { GetData, LoadersDataReturnType } from '@/types/routeLoaders'
import { GetProps, ViewsPropsReturnType } from '@/types/routeViews'
import { LastInArray } from '@/types/utilities'

type GenericParent = {
  name: string,
  getData: GetData,
  getProps: GetProps,
  /** @deprecated Use parent.getProps() or parent.getProps(name). */
  props: unknown,
  /** @deprecated Use parent.getData() or parent.getData(name). */
  data: unknown,
}

export type PropsCallbackParent<
  TParent extends Route | undefined = Route | undefined
> = Route | undefined extends TParent
  ? GenericParent | undefined
  : TParent extends Route
    ? {
        name: TParent['name'],
        getData: GetData<RouteLoadersOf<TParent['matches']>>,
        getProps: GetParentPropsGetter<TParent>,
        /** @deprecated Use parent.getProps() or parent.getProps(name). */
        props: GetParentPropsReturnType<TParent>,
        /** @deprecated Use parent.getData() or parent.getData(name). */
        data: GetParentDataReturnType<TParent>,
      }
    : undefined

type GetParentPropsReturnType<
  TParent extends Route | undefined = Route | undefined
> = TParent extends Route
  ? LastInArray<TParent['matches']> extends { views: infer TViews }
    ? ViewsPropsReturnType<TViews>
    : undefined
  : undefined

type GetParentDataReturnType<
  TParent extends Route | undefined = Route | undefined
> = TParent extends Route
  ? LastInArray<TParent['matches']> extends { loaders: infer TLoaders }
    ? LoadersDataReturnType<TLoaders>
    : undefined
  : undefined

type GetParentPropsGetter<TParent extends Route> = GetProps<LastInArray<TParent['matches']>['views']>
