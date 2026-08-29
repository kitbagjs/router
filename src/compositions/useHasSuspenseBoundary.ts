import { getCurrentInstance } from 'vue'

/**
 * Whether the component is inside a Suspense boundary. Must be called during setup.
 */
export function useHasSuspenseBoundary(): boolean {
  const instance = getCurrentInstance()

  // @ts-expect-error suspense is not on the public ComponentInternalInstance type
  return Boolean(instance?.suspense)
}
