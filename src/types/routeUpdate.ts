import { ResolvedRoute } from '@/types/resolved'
import { RouterPushOptions } from '@/types/routerPush'

export type RouteUpdate<TRoute extends ResolvedRoute = ResolvedRoute> = ResolvedRoute extends TRoute ? {
  (paramName: string, paramValue: unknown, options?: RouterPushOptions): Promise<void>,
  (params: Partial<TRoute['params']>, options?: RouterPushOptions): Promise<void>,
} : {
  <TParamName extends keyof TRoute['params']>(paramName: TParamName, paramValue: TRoute['params'][TParamName], options?: RouterPushOptions): Promise<void>,
  (params: Partial<TRoute['params']>, options?: RouterPushOptions): Promise<void>,
}
