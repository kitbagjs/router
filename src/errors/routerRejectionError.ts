import { RouterRejectionType } from '@/services/createRouterReject'

/**
 * Represents an error thrown when a routing action is explicitly rejected, categorized by a specific rejection type.
 */
export class RouterRejectionError extends Error {
  public type: RouterRejectionType

  public constructor(type: RouterRejectionType) {
    super(`Routing action rejected: ${type}`)

    this.type = type
  }
}

