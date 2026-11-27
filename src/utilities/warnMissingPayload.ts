import { warn } from '@/utilities/warn'

export function warnMissingPayload(): void {
  warn('Hydrating server rendered markup, but no router payload was found. The initial route was adopted so hydration matches the server, but its props and loaders run again on the client. Embed the `payload` returned by `router.render()` in the html the server sends.')
}
