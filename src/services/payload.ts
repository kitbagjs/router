import { DataKind } from '@/services/createNavigationStores'
import { isRecord } from '@/utilities/guards'
import { isBrowser } from '@/utilities/isBrowser'
import { RouteValue } from '@/services/createRouteValueStore'

export const PAYLOAD_ELEMENT_ID = 'kitbag-payload'

const LINE_SEPARATOR = String.fromCharCode(0x2028)
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029)

/**
 * The payload as a script tag to embed in the document a server sends.
 *
 * `<` is escaped so nothing in the payload can close the tag early, and the two unicode line separators
 * because they terminate a line in javascript source. All three are json unicode escapes, so `JSON.parse`
 * gives back exactly what went in.
 */
export function payloadToScript(payload: RouterPayload): string {
  const json = JSON.stringify(payload)
    .replace(/</g, '\\u003C')
    .replace(new RegExp(LINE_SEPARATOR, 'g'), '\\u2028')
    .replace(new RegExp(PARAGRAPH_SEPARATOR, 'g'), '\\u2029')

  return `<script type="application/json" id="${PAYLOAD_ELEMENT_ID}">${json}</script>`
}

export type PayloadValue = {
  kind: DataKind,
  depth: number,
  name: string,
  encoded: string,
}

export type RouterPayload = {
  /**
   * The url the server rendered.
   */
  url: string,
  /**
   * The type of the rejection the server rendered, when it rendered one.
   */
  rejection?: string | null,
  values: PayloadValue[],
}

function isDataKind(value: unknown): value is DataKind {
  return value === 'props' || value === 'loader'
}

function isPayloadValue(value: unknown): value is PayloadValue {
  return isRecord(value)
    && isDataKind(value.kind)
    && typeof value.depth === 'number'
    && typeof value.name === 'string'
    && typeof value.encoded === 'string'
}

export function isRouterPayload(value: unknown): value is RouterPayload {
  return isRecord(value)
    && typeof value.url === 'string'
    && (value.rejection === undefined || value.rejection === null || typeof value.rejection === 'string')
    && Array.isArray(value.values)
    && value.values.every(isPayloadValue)
}

/**
 * The payload a server embedded in the document, or undefined when this is not a hydration.
 */
export function getHydratingPayload(): RouterPayload | undefined {
  if (!isBrowser()) {
    return undefined
  }

  const raw = document.getElementById(PAYLOAD_ELEMENT_ID)?.textContent

  if (!raw) {
    return undefined
  }

  try {
    const parsed: unknown = JSON.parse(raw)

    return isRouterPayload(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

/**
 * Encodes settled values as json for the payload. A value json cannot carry is left out, and the client
 * computes it again.
 */
export function encodePayloadValues(values: RouteValue[]): PayloadValue[] {
  return values.flatMap(({ kind, depth, name, value }) => {
    const encoded = JSON.stringify(value)

    if (typeof encoded !== 'string') {
      return []
    }

    return [{ kind, depth, name, encoded }]
  })
}

/**
 * Decodes payload values for the store to adopt. A value json cannot read is left out, and its getter
 * runs as usual.
 */
export function decodePayloadValues(values: PayloadValue[]): RouteValue[] {
  return values.flatMap(({ kind, depth, name, encoded }) => {
    try {
      return [{ kind, depth, name, value: JSON.parse(encoded) as unknown }]
    } catch {
      return []
    }
  })
}
