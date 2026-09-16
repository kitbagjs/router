import { DataKind } from '@/services/createNavigationStores'

/**
 * An error thrown when a declared payload option cannot write a value into the payload or read it
 * back out.
 * @group Errors
 */
export class PayloadValueError extends Error {
  public constructor(action: 'stringify' | 'parse', kind: DataKind, name: string, cause: unknown) {
    super(`Unable to ${action} the payload value for ${kind} "${name}"`, { cause })
  }
}
