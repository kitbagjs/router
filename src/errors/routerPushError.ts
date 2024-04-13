export class RouterPushError extends Error {
  public to: unknown[]

  public constructor(to: unknown[]) {
    super()

    this.to = to
  }
}