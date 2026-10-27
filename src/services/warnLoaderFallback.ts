import { AnyLoader } from '@/types/loader'
import { ResolvedRoute } from '@/types/resolved'
import { LoaderLocationMissing, LoaderLocationAmbiguous } from '@/services/getLoaderLocation'
import { warn } from '@/utilities/warn'

type WarnLoaderFallbackOptions = {
  loader: AnyLoader,
  route: ResolvedRoute,
  fallback: LoaderLocationMissing | LoaderLocationAmbiguous,
  isServerRendering: boolean,
}

export function warnLoaderFallback({ loader, route, fallback, isServerRendering }: WarnLoaderFallbackOptions): void {
  warnLoaderFallbackReason({ loader, route, fallback })

  if (!isServerRendering) {
    return
  }

  warn(`The fallback data for this loader on route "${route.name || route.href}" is not included in the SSR payload. It will run again on the client. Attach it with addLoader, or pass route.loaders[name] to select an attachment.`, loader)
}

function warnLoaderFallbackReason({ loader, route, fallback }: Omit<WarnLoaderFallbackOptions, 'isServerRendering'>): void {
  const routeName = route.name || route.href

  if (fallback.reason === 'ambiguous') {
    const names = fallback.names.map((name) => JSON.stringify(name)).join(', ')

    warn(`useLoader found multiple attachments for this loader on route "${routeName}": ${names}. It will run separately. Pass route.loaders[name] to select an attachment.`, loader)
    return
  }

  warn(`useLoader received a loader that is not attached to route "${routeName}". It will run now. Attach it with addLoader to start loading before component setup.`, loader)
}
