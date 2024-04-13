/* eslint-disable max-classes-per-file */
import { RouterPush } from '@/types/routerPush'
import { RouterRoutes } from '@/types/routerRoute'
import { RouterRejectionType } from '@/utilities/createRouterReject'

export class RouterRejectionError extends Error {
  public type: RouterRejectionType

  public constructor(type: RouterRejectionType) {
    super()

    this.type = type
  }
}

export class RouterPushError<T extends RouterRoutes> extends Error {
  public to: Parameters<RouterPush<T>>

  public constructor(to: Parameters<RouterPush<T>>) {
    super()

    this.to = to
  }
}