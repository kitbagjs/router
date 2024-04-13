import { RouterRoutes } from '@/types'
import { RouterPush } from '@/types/routerPush'

export class RouterPushError<T extends RouterRoutes> extends Error {
  public to: Parameters<RouterPush<T>>

  public constructor(to: Parameters<RouterPush<T>>) {
    super()

    this.to = to
  }
}