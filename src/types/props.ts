import { Route } from '@/types/route'
import { LoadersDataReturnType } from '@/types/routeLoaders'
import { ViewsPropsReturnType } from '@/types/routeViews'
import { LastInArray } from '@/types/utilities'

export type PropsCallbackParent<
  TParent extends Route | undefined = Route | undefined
> = Route | undefined extends TParent
  ? undefined | { name: string, props: unknown, data: unknown }
  : TParent extends Route
    ? {
        name: TParent['name'],
        props: GetParentPropsReturnType<TParent>,
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
