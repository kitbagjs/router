import { ResolvedRoute } from '@/types/resolved'
import { RouterPushOptions } from '@/types/routerPush'

export type RouteUpdate<TRoute extends ResolvedRoute = ResolvedRoute> = ResolvedRoute extends TRoute ? {
  (key: string, value: unknown, options?: RouterPushOptions): Promise<void>,
  (params: Partial<TRoute['params']>, options?: RouterPushOptions): Promise<void>,
}: {
  <TKey extends keyof TRoute['params']>(key: TKey, value: TRoute['params'][TKey], options?: RouterPushOptions): Promise<void>,
  (params: Partial<TRoute['params']>, options?: RouterPushOptions): Promise<void>,
}