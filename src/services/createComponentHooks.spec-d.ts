import { expectTypeOf, test } from 'vitest'
import { ComponentHookRegistration, HookRemove } from '@/types/hooks'
import { ResolvedRoute } from '@/types/resolved'

test('component registration types follow the lifecycle', () => {
  const beforeUpdate: ComponentHookRegistration = {
    lifecycle: 'onBeforeRouteUpdate',
    depth: 0,
    hook: (to, context) => {
      expectTypeOf(to).toEqualTypeOf<ResolvedRoute>()
      expectTypeOf(context.lifecycle).toEqualTypeOf<'before'>()
      expectTypeOf(context.remove).toEqualTypeOf<HookRemove>()
      context.abort()
    },
  }

  const afterLeave: ComponentHookRegistration = {
    lifecycle: 'onAfterRouteLeave',
    depth: 0,
    hook: (to, context) => {
      expectTypeOf(to).toEqualTypeOf<ResolvedRoute | null>()
      expectTypeOf(context.from).toEqualTypeOf<ResolvedRoute>()
      expectTypeOf(context.lifecycle).toEqualTypeOf<'after'>()
      // @ts-expect-error after hooks cannot abort navigation
      context.abort()
    },
  }

  // @ts-expect-error a before callback cannot be registered as an after hook
  const wrongLifecycle: ComponentHookRegistration = { ...beforeUpdate, lifecycle: 'onAfterRouteUpdate' }

  expectTypeOf(afterLeave).toExtend<ComponentHookRegistration>()
  expectTypeOf(wrongLifecycle).toExtend<ComponentHookRegistration>()
})
