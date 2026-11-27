import { getCurrentInstance } from 'vue'

/**
 * Whether the current component is adopting server rendered markup during the app's first mount, which
 * only happens for an app created with `createSSRApp`. Must be called during setup.
 */
export function isHydrating(): boolean {
  const instance = getCurrentInstance()

  if (!instance) {
    return false
  }

  // The app's container is set once its first mount finishes, so a later component that reuses an
  // element (like a cached vnode) is not mistaken for hydration.
  const isFirstMount = instance.appContext.app._container === null

  return isFirstMount && instance.vnode.el !== null
}
