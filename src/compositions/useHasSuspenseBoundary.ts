import { getCurrentInstance } from 'vue'

/**
 * Must be called during setup. Vue has no public api for this: the public `VNode.suspense` is not the
 * enclosing boundary and reads false inside one, and a boundary never appears in the `parent` chain.
 */
export function useHasSuspenseBoundary(): boolean {
  const instance = getCurrentInstance()

  // @ts-expect-error suspense is not on the public ComponentInternalInstance type
  return Boolean(instance?.suspense)
}
