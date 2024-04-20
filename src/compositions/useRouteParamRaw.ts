import { Ref } from 'vue'
import { ExtractRouteParamTypes, Route } from '@/types'

type ParamRawValue<T> = Extract<T, undefined> extends never ? string : string | undefined

export function useRouteParamRaw<
  TRoute extends Route,
  TParam extends keyof ExtractRouteParamTypes<TRoute>,
  TParamType extends ParamRawValue<ExtractRouteParamTypes<TRoute>[TParam]>
>(_route: TRoute, _param: TParam, _defaultValue?: TParamType): Ref<ParamRawValue<TParamType>> {
  throw 'not implemented'
}