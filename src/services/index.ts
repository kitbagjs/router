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
import { withParams, WithParams, toWithParams } from './withParams'
/**
 * @deprecated use `toWithParams` instead
 */
export const toPath = toWithParams
/**
 * @deprecated use `withParams` instead
 */
export const path = withParams
/**
 * @deprecated use `WithParams` instead
 */
export type Path = WithParams
/**
 * @deprecated use `toWithParams` instead
 */
export const toHost = toWithParams
/**
 * @deprecated use `withParams` instead
 */
export const host = withParams
/**
 * @deprecated use `toWithParams` instead
 */
export const toQuery = toWithParams
/**
 * @deprecated use `withParams` instead
 */
export const query = withParams
/**
 * @deprecated use `WithParams` instead
 */
export type Query = WithParams
