import { RouterRejectionType } from '@/services/createRouterReject'

export class RouterRejectionError extends Error {
  public type: RouterRejectionType

  public constructor(type: RouterRejectionType) {
    super()

    this.type = type
  }
}