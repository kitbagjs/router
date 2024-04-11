import { RouterRejectionType } from '@/utilities'

export class RouterRejectionError extends Error {
  public type: RouterRejectionType

  public constructor(type: RouterRejectionType) {
    super()

    this.type = type
  }
}