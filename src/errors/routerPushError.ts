import { RouterPushImplementation } from '@/types/routerPush'

export class RouterPushError extends Error {
  public to: Parameters<RouterPushImplementation>

  public constructor(to: Parameters<RouterPushImplementation>) {
    super()

    this.to = to
  }
}