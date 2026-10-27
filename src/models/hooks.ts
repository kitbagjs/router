import { AnyHook } from '@/types/hook'
import { AfterHook, BeforeHook, ComponentHook, HookEntry, HookRegistrationOptions, HookStoreKey, HookTypes } from '@/types/hooks'

type Registration = {
  lifecycle: HookStoreKey,
  entry: HookEntry<HookTypes[HookStoreKey]>,
}

/**
 * Owns hook registrations or assembles them as an execution's source of truth.
 * Aggregation preserves registration order and each entry's original remover.
 */
export class Hooks {
  public onHookAdded = new Set<(hook: ComponentHook | AnyHook) => void>()
  private readonly registrations: Registration[] = []

  public get<TLifecycle extends HookStoreKey>(lifecycle: TLifecycle): HookEntry<HookTypes[TLifecycle]>[] {
    return this.registrations
      .filter((registration) => registration.lifecycle === lifecycle)
      .map((registration) => registration.entry as HookEntry<HookTypes[TLifecycle]>)
  }

  public has<TLifecycle extends HookStoreKey>(hook: HookTypes[TLifecycle] | HookEntry<HookTypes[TLifecycle]>, lifecycle: TLifecycle): boolean {
    return this.get(lifecycle).some((entry) => entry === hook || entry.hook === hook)
  }

  public add(source: Hooks, lifecycle: HookStoreKey): void
  public add<TLifecycle extends HookStoreKey>(entry: HookEntry<HookTypes[TLifecycle]>, lifecycle: TLifecycle): void
  public add<TLifecycle extends HookStoreKey>(hook: HookTypes[TLifecycle], lifecycle: TLifecycle, options?: HookRegistrationOptions): HookEntry<HookTypes[TLifecycle]>
  public add<TLifecycle extends HookStoreKey>(source: Hooks | HookEntry<HookTypes[TLifecycle]> | HookTypes[TLifecycle], lifecycle: TLifecycle, { signal }: HookRegistrationOptions = {}): HookEntry<HookTypes[TLifecycle]> | void {
    if (source instanceof Hooks) {
      for (const entry of source.get(lifecycle)) {
        this.registrations.push({ lifecycle, entry })
      }

      return
    }

    if (typeof source === 'object' && 'remove' in source) {
      this.registrations.push({ lifecycle, entry: source })

      return
    }

    const hook = source

    if (signal?.aborted) {
      return { hook, remove: () => {} }
    }

    const entry = { hook, remove }
    const registration = { lifecycle, entry }
    const registrations = this.registrations

    function remove(): void {
      const index = registrations.indexOf(registration)

      if (index !== -1) {
        registrations.splice(index, 1)
      }

      signal?.removeEventListener('abort', remove)
    }

    registrations.push(registration)
    signal?.addEventListener('abort', remove, { once: true })

    return entry
  }

  public delete<TLifecycle extends HookStoreKey>(hook: HookTypes[TLifecycle] | HookEntry<HookTypes[TLifecycle]>, lifecycle: TLifecycle): boolean {
    const index = this.registrations.findIndex((registration) => registration.lifecycle === lifecycle
      && (registration.entry === hook || registration.entry.hook === hook))

    if (index === -1) {
      return false
    }

    const [registration] = this.registrations.splice(index, 1)

    registration.entry.remove()

    return true
  }

  public getBeforeHooks(): HookEntry<BeforeHook>[] {
    return [
      ...this.get('redirects'),
      ...this.get('onBeforeRouteEnter'),
      ...this.get('onBeforeRouteUpdate'),
      ...this.get('onBeforeRouteLeave'),
    ]
  }

  public getAfterHooks(): HookEntry<AfterHook>[] {
    return [
      ...this.get('onAfterRouteLeave'),
      ...this.get('onAfterRouteUpdate'),
      ...this.get('onAfterRouteEnter'),
    ]
  }
}
