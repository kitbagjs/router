export * from './createParam'
export * from './createRouter'
export { withParams } from './withParams'
export type { RouterRoute } from './createRouterRoute'
export { withDefault } from './withDefault'
export { createRouterPlugin } from './createRouterPlugin'
export { unionOf } from './unionOf'
export { arrayOf } from './arrayOf'
export { tupleOf } from './tupleOf'

// backwards compatible withParams
import { withParams } from './withParams'
/**
 * @deprecated use `withParams` instead
 * @hidden we don't want to expose this in the api docs
 */
export const path = withParams
/**
 * @deprecated use `withParams` instead
 * @hidden we don't want to expose this in the api docs
*/
export const host = withParams
/**
 * @deprecated use `withParams` instead
 * @hidden we don't want to expose this in the api docs
 */
export const query = withParams
