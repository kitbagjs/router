import { expectTypeOf, test } from 'vitest'
import { Hooks } from '@/models/hooks'
import { AnyHook } from '@/types/hook'
import { AfterHook, AfterEnterHook, BeforeEnterHook, BeforeHook, HookEntry } from '@/types/hooks'
import { registerHook } from '@/services/registerHook'

test('the container accepts entries and registration retains hook kind types', () => {
  const hooks = new Hooks()
  registerHook(hooks, () => {}, 'onBeforeRouteEnter')
  const entry = hooks.get('onBeforeRouteEnter')[0]
  expectTypeOf(entry).toEqualTypeOf<HookEntry<BeforeEnterHook | AnyHook>>()
  expectTypeOf(hooks.getBeforeHooks()).toEqualTypeOf<HookEntry<BeforeHook>[]>()
  expectTypeOf(hooks.getAfterHooks()).toEqualTypeOf<HookEntry<AfterHook>[]>()
  expectTypeOf(hooks.add(entry)).toEqualTypeOf<void>()
  const after: AfterEnterHook = () => {}

  // @ts-expect-error callbacks must be registered before adding their entries
  hooks.add(after)
  // @ts-expect-error aggregation explicitly passes entries from another container
  hooks.add(new Hooks())
  // @ts-expect-error after callbacks cannot be registered as before hooks
  registerHook(hooks, after, 'onBeforeRouteEnter')
  // @ts-expect-error registration notifications are not execution hooks
  hooks.get('onHookAdded')
})
