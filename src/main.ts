// Types
export * from './types/createRouteOptions'
export * from './types/hooks'
export * from './types/paramTypes'
export * from './types/prefetch'
export * from './types/props'
export * from './types/querySource'
export * from './types/resolved'
export * from './types/route'
export * from './types/router'
export * from './types/routerLink'
export * from './types/routerPlugin'
export * from './types/routerPush'
export * from './types/routerPush'
export * from './types/routerReject'
export * from './types/routerReplace'
export * from './types/routerReplace'
export * from './types/routerResolve'
export * from './types/routerResolve'
export * from './types/routerRoute'
export * from './types/url'
export * from './types/useLink'

// Errors
export { DuplicateParamsError } from './errors/duplicateParamsError'
export { MetaPropertyConflict } from './errors/metaPropertyConflict'
export { RouterNotInstalledError } from './errors/routerNotInstalledError'
export { UseRouteInvalidError } from './errors/useRouteInvalidError'

// Services
export { createRoute } from './services/createRoute'
export { createRejection } from './services/createRejection'
export { createExternalRoute } from './services/createExternalRoute'
export { createRouterAssets, type RouterAssets } from './services/createRouterAssets'
export { withParams } from './services/withParams'
export { withDefault } from './services/withDefault'
export { createRouterPlugin } from './services/createRouterPlugin'
export { unionOf } from './services/unionOf'
export { arrayOf } from './services/arrayOf'
export { tupleOf } from './services/tupleOf'
export { createParam } from './services/createParam'
export { createRouter } from './services/createRouter'

// backwards compatible withParams
import { withParams } from './services/withParams'
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
