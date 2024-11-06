import { RegisteredRejectionType } from '@/types/register'

export class RouterRejectionError extends Error {
  public type: RegisteredRejectionType

  public constructor(type: RegisteredRejectionType) {
    super(`Routing action rejected: ${type}`)

    this.type = type
  }
}
