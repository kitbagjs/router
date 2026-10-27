import { Hooks } from '@/models/hooks'

export type HookStoreKey = Exclude<keyof Hooks, 'onHookAdded'>

/**
 * The source of truth for hooks selected from multiple hook stores for an execution.
 * Built at runtime, preserving separate registrations and their order. The original
 * stores continue to own registration and removal.
 */
export type HooksCollection = {
  [TKey in HookStoreKey]: Hooks[TKey] extends Set<infer THook> ? THook[] : never
} & {
  /**
   * Appends one store's registrations for the selected hook kind in insertion order.
   */
  add: (store: Hooks, lifecycle: HookStoreKey) => void,
}
