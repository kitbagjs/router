/* eslint-disable max-classes-per-file */
import { RouterPushImplementation } from '@/types/routerPush'
import { RouterRejectionType } from '@/utilities/createRouterReject'

export class RouterRejectionError extends Error {
  public type: RouterRejectionType

  public constructor(type: RouterRejectionType) {
    super()

    this.type = type
  }
}

export class RouterPushError extends Error {
  public to: Parameters<RouterPushImplementation>

  public constructor(to: Parameters<RouterPushImplementation>) {
    super()

    this.to = to
  }
}