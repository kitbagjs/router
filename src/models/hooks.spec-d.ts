import { expectTypeOf, test } from 'vitest'
import { Hooks } from '@/models/hooks'
import { AnyHook } from '@/types/hook'
import { AfterHook, AfterEnterHook, BeforeEnterHook, BeforeHook, HookEntry } from '@/types/hooks'

test('hook kinds retain callback and entry types', () => {
  const hooks = new Hooks()
  const entry = hooks.add(() => {}, 'onBeforeRouteEnter')
  expectTypeOf(entry).toEqualTypeOf<HookEntry<BeforeEnterHook | AnyHook>>()
  expectTypeOf(hooks.get('onBeforeRouteEnter')).toEqualTypeOf<HookEntry<BeforeEnterHook | AnyHook>[]>()
  expectTypeOf(hooks.getBeforeHooks()).toEqualTypeOf<HookEntry<BeforeHook>[]>()
  expectTypeOf(hooks.getAfterHooks()).toEqualTypeOf<HookEntry<AfterHook>[]>()
  expectTypeOf(hooks.add(new Hooks(), 'onBeforeRouteEnter')).toEqualTypeOf<void>()
  expectTypeOf(hooks.add(entry, 'onBeforeRouteEnter')).toEqualTypeOf<void>()
  const after: AfterEnterHook = () => {}

  // @ts-expect-error after callbacks cannot be registered as before hooks
  hooks.add(after, 'onBeforeRouteEnter')
  // @ts-expect-error registration notifications are not execution hooks
  hooks.get('onHookAdded')
})
