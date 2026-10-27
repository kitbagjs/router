import { AnyHook } from '@/types/hook'
import { AfterHook, BeforeHook, ComponentHook, HookEntry, HookStoreKey, HookTypes } from '@/types/hooks'

type Entry = HookEntry<HookTypes[HookStoreKey]>

/**
 * Stores registration entries or assembles them as an execution's source of truth.
 * Aggregation preserves registration order and each entry's original remover.
 */
export class Hooks {
  public onHookAdded = new Set<(hook: ComponentHook | AnyHook) => void>()
  private readonly entries: Entry[] = []

  /**
   * Returns a snapshot of registrations for one hook kind.
   */
  public get<TLifecycle extends HookStoreKey>(lifecycle: TLifecycle): HookEntry<HookTypes[TLifecycle]>[] {
    return this.entries.filter((entry): entry is HookEntry<HookTypes[TLifecycle]> => entry.lifecycle === lifecycle)
  }

  public has(entry: Entry): boolean {
    return this.entries.includes(entry)
  }

  public add(...entries: Entry[]): void {
    this.entries.push(...entries)
  }

  /**
   * Removes an entry from this container. Its remover still belongs to the source registration.
   */
  public delete(entry: Entry): boolean {
    const index = this.entries.indexOf(entry)

    if (index === -1) {
      return false
    }

    this.entries.splice(index, 1)

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
