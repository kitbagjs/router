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
export const toPath = toWithParams
export const path = withParams
export type Path = WithParams
export const toHost = toWithParams
export const host = withParams
export type Host = WithParams
export const toQuery = toWithParams
export const query = withParams
export type Query = WithParams
