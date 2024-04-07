import { Ref } from 'vue'
import { ExtractRouterRouteParamTypes, RouterRoute } from '@/types'

type ParamRawValue<T> = Extract<T, undefined> extends never ? string : string | undefined

export function useRouteParamRaw<
  TRoute extends RouterRoute,
  TParam extends keyof ExtractRouterRouteParamTypes<TRoute>,
  TParamType extends ParamRawValue<TParam[TParam]>
>(_route: TRoute, _param: TParam, _defaultValue?: TParamType): Ref<ParamRawValue<TParamType>> {
  throw 'not implemented'
}
