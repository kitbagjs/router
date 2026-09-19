import { DataKind } from '@/services/createNavigationStores'

/**
 * A payload value that could not be written into the payload or read back out. Reported rather than
 * thrown: the value is left out and its getter runs again on the client.
 * @group Errors
 */
export class PayloadValueError extends Error {
  public constructor(action: 'stringify' | 'parse', kind: DataKind, name: string, cause: unknown) {
    super(`Unable to ${action} the payload value for ${kind} "${name}"`, { cause })
  }
}
