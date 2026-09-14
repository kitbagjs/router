import { StandardSchemaV1 } from '@standard-schema/spec'

/**
 * An error thrown when a param is a standard schema from a vendor the router does not support.
 */
export class UnsupportedSchemaVendorError extends Error {
  public constructor(schema: StandardSchemaV1) {
    super(`Unsupported schema vendor: ${schema['~standard'].vendor}`)
  }
}
