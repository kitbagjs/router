import { DataKind } from '@/services/createNavigationStores'
import { isRecord } from '@/utilities/guards'
import { isBrowser } from '@/utilities/isBrowser'
import { RouteValue } from '@/services/createRouteValueStore'
import { Computation, getComputations } from '@/services/getComputations'
import { PayloadValueError } from '@/errors/payloadValueError'
import { ResolvedRoute } from '@/types/resolved'

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

/**
 * How a prop or loader value is sent from a server to a client, in place of json.
 */
export type PayloadOptions<TValue = unknown> = {
  payload?: PayloadStringifier<TValue>,
}

export type PayloadStringifier<TValue = unknown> = {
  /**
   * Turns a value into a string for the payload.
   */
  stringify: (value: TValue) => string,
  /**
   * Turns a string from the payload back into a value.
   */
  parse: (encoded: string) => TValue,
}

/**
 * A stringifier whose value type has been erased. Every loader's and view's stringifier is stored in
 * one record, so a stored one is typed for some value the record no longer names — `unknown` would
 * claim it accepts anything, which a typed stringify does not.
 */
export type AnyPayloadStringifier = PayloadStringifier<any>

export const jsonStringifier: PayloadStringifier = {
  stringify: JSON.stringify,
  parse: JSON.parse,
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
 * Encodes settled values for the payload, each through its own stringifier or the fallback. A value the
 * default json cannot carry is left out, and the client computes it again; a declared stringifier that
 * fails throws a {@link PayloadValueError}.
 */
export function encodePayloadValues(route: ResolvedRoute, values: RouteValue[], fallback: PayloadStringifier = jsonStringifier): PayloadValue[] {
  const computations = getComputations(route)

  return values.flatMap(({ kind, depth, name, value }) => {
    const stringifier = findStringifier(computations, { kind, depth, name }) ?? fallback

    try {
      const encoded = stringifier.stringify(value)

      if (typeof encoded !== 'string') {
        throw new Error(`stringify returned ${typeof encoded}`)
      }

      return [{ kind, depth, name, encoded }]
    } catch (error) {
      if (stringifier === jsonStringifier) {
        return []
      }

      throw new PayloadValueError('stringify', kind, name, error)
    }
  })
}

/**
 * Decodes payload values for the store to adopt, each through its own stringifier or the fallback. A
 * value the default json cannot read is left out, and its getter runs as usual; a declared parse that
 * fails throws a {@link PayloadValueError}.
 */
export function decodePayloadValues(route: ResolvedRoute, values: PayloadValue[], fallback: PayloadStringifier = jsonStringifier): RouteValue[] {
  const computations = getComputations(route)

  return values.flatMap(({ kind, depth, name, encoded }) => {
    const stringifier = findStringifier(computations, { kind, depth, name }) ?? fallback

    try {
      return [{ kind, depth, name, value: stringifier.parse(encoded) as unknown }]
    } catch (error) {
      if (stringifier === jsonStringifier) {
        return []
      }

      throw new PayloadValueError('parse', kind, name, error)
    }
  })
}

function findStringifier(computations: Computation[], { kind, depth, name }: Pick<PayloadValue, 'kind' | 'depth' | 'name'>): AnyPayloadStringifier | undefined {
  return computations.find((computation) => computation.kind === kind && computation.depth === depth && computation.name === name)?.payload
}
