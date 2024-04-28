import { ResolvedRoute } from '@/types/resolved'
import { RouterPushOptions } from '@/types/routerPush'

export type RouteUpdate<TRoute extends ResolvedRoute = ResolvedRoute> = {
  <TKey extends keyof TRoute['params']>(key: TKey, value: TRoute['params'][TKey], options?: RouterPushOptions): Promise<void>,
  (params: Partial<TRoute['params']>, options?: RouterPushOptions): Promise<void>,
}