import { Ref } from 'vue'
import { ExtractRouteMethodParams, RouteMethod } from '@/types/routeMethods'

type ParamRawValue<T> = Extract<T, undefined> extends never ? string : string | undefined

export function useRouteParamRaw<
  TRoute extends RouteMethod,
  TParam extends keyof ExtractRouteMethodParams<TRoute>,
  TParamType extends ParamRawValue<ExtractRouteMethodParams<TRoute>[TParam]>
>(_route: TRoute, _param: TParam, _defaultValue?: TParamType): Ref<ParamRawValue<TParamType>> {
  throw 'not implemented'
}
