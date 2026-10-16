import { computed, ComputedRef, InjectionKey, markRaw } from 'vue'
import { LoaderHandle, LoaderHandleInternal, IS_LOADER_HANDLE_SYMBOL } from '@/types/loaderHandle'
import { Router } from '@/types/router'
import { ResolvedRoute, WithData } from '@/types/resolved'
import { isPromise } from '@/utilities/promises'

export function createLoaderHandles(routerKey: InjectionKey<Router>, route: ResolvedRoute & WithData): ComputedRef<Record<string, LoaderHandle>> {
  const handles = new Map<string, LoaderHandle>()

  function getHandle(matchId: string, name: string): LoaderHandle {
    const key = JSON.stringify([matchId, name])
    const existing = handles.get(key)

    if (existing) {
      return existing
    }

    const internal = {
      [IS_LOADER_HANDLE_SYMBOL]: true,
      matchId,
      routerKey,
    } satisfies LoaderHandleInternal

    const handle: LoaderHandle = markRaw({
      ...internal,
      name,
      get data() {
        if (!route.matches.some((match) => match.id === matchId && name in match.loaders)) {
          throw new Error(`Loader "${name}" is not attached to the current route`)
        }

        const data = route.data

        if (!data) {
          throw new Error(`Loader "${name}" has no data for the current route`)
        }

        if (isPromise(data) && typeof data.then === 'function') {
          return data
        }

        return Reflect.get(data, name)
      },
    })

    handles.set(key, handle)

    return handle
  }

  return computed(() => markRaw(Object.fromEntries(route.matches.flatMap((match) => {
    return Object.keys(match.loaders).map((name) => [name, getHandle(match.id, name)])
  }))))
}
