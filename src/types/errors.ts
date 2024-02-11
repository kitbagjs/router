/* eslint-disable max-classes-per-file */
import { RouterPushImplementation } from '@/utilities'
import { RouterRejectionType } from '@/utilities/createRouterReject'
import { RouterReplaceImplementation } from '@/utilities/createRouterReplace'

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

export class RouterReplaceError extends Error {
  public to: Parameters<RouterReplaceImplementation>

  public constructor(to: Parameters<RouterReplaceImplementation>) {
    super()

    this.to = to
  }
}