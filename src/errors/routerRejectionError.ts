import { RouterRejectionType } from '@/services/createRouterReject'

export class RouterRejectionError extends Error {
  public type: RouterRejectionType

  public constructor(type: RouterRejectionType) {
    super(`Routing action rejected: ${type}`)

    this.type = type
  }
}

