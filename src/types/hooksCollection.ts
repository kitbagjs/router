import { Hooks } from '@/models/hooks'

export type HooksCollection = {
  [TKey in Exclude<keyof Hooks, 'onHookAdded'>]: Hooks[TKey] extends Set<infer THook> ? THook[] : never
}
