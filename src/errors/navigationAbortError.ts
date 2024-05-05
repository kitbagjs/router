/**
 * Represents an error thrown when navigation is aborted within a routing process.
 * This error can be thrown from inside of BeforeRouteHook callback, which will abort the route change.
 */
export class NavigationAbortError extends Error {}