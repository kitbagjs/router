import { Page } from '@/types/page'
import { ServerRenderResponse } from '@/types/router'
import { RouteValueStore } from '@/services/createRouteValueStore'
import { encodePayloadValues, payloadToScript, TransformerOptions } from '@/services/payload'

type PageResponseOptions = TransformerOptions & {
  url: string,
  title: string | undefined,
  values: RouteValueStore,
}

/** Translates the common page back into the public SSR response and hydration payload. */
export function getPageResponse(page: Page, { url, title, values: store, transformer }: PageResponseOptions): ServerRenderResponse {
  const { source, status } = page

  if (source.kind === 'rejection') {
    const rejection = source.rejection.type

    return { kind: 'reject', status, rejection, title, payload: payloadToScript({ kind: 'reject', url, rejection }) }
  }

  const { values, failures } = encodePayloadValues(source.route, store.getValues(source.route), transformer)

  return { kind: 'success', status, title, failures, payload: payloadToScript({ kind: 'success', url, values }) }
}
