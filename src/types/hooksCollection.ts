import { Hooks } from '@/models/hooks'

/**
 * The source of truth for hooks selected from multiple hook stores for an execution.
 * Built at runtime, preserving separate registrations and their order. The original
 * stores continue to own registration and removal.
 */
export type HooksCollection = {
  [TKey in Exclude<keyof Hooks, 'onHookAdded'>]: Hooks[TKey] extends Set<infer THook> ? THook[] : never
}
