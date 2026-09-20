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

export type TransformerOptions<TValue = unknown> = {
  /**
   * Transforms a value across the server render payload: `stringify` writes the value into the payload
   * on the server, and `parse` reads it back on the client during hydration. Declare one for any value
   * json cannot carry faithfully, such as a `Map`, `Set`, or `Date`, so the client adopts the same
   * value the server rendered with. Defaults to json.
   */
  transformer?: PayloadTransformer<TValue>,
}

export type PayloadTransformer<TValue = unknown> = {
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
 * A transformer whose value type has been erased. Every loader's and view's transformer is stored in
 * one record, so a stored one is typed for some value the record no longer names — `unknown` would
 * claim it accepts anything, which a typed stringify does not.
 */
export type AnyPayloadTransformer = PayloadTransformer<any>

export const jsonTransformer: PayloadTransformer = {
  stringify: JSON.stringify,
  parse: JSON.parse,
}

export type PayloadValue = {
  kind: DataKind,
  depth: number,
  name: string,
  encoded: string,
}

export type RouterPayload = SuccessPayload | RejectPayload

type SuccessPayload = {
  kind: 'success',
  /**
   * The url the server rendered.
   */
  url: string,
  values: PayloadValue[],
}

type RejectPayload = {
  kind: 'reject',
  /**
   * The url the server rendered.
   */
  url: string,
  /**
   * The type of the rejection the server rendered.
   */
  rejection: string,
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
  if (!isRecord(value) || typeof value.url !== 'string') {
    return false
  }

  if (value.kind === 'success') {
    return Array.isArray(value.values) && value.values.every(isPayloadValue)
  }

  if (value.kind === 'reject') {
    return typeof value.rejection === 'string'
  }

  return false
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

type EncodedPayloadValues = {
  values: PayloadValue[],
  failures: PayloadValueError[],
}

/**
 * Encodes settled values for the payload, each through its own stringifier or the fallback. A value that
 * cannot be encoded is warned about, reported as a failure, and left out, so the client computes it again.
 */
export function encodePayloadValues(route: ResolvedRoute, values: RouteValue[], fallback: PayloadTransformer = jsonTransformer): EncodedPayloadValues {
  const computations = getComputations(route)
  const encoded: PayloadValue[] = []
  const failures: PayloadValueError[] = []

  for (const { kind, depth, name, value } of values) {
    const transformer = findTransformer(computations, { kind, depth, name }) ?? fallback

    try {
      const string = transformer.stringify(value)

      if (typeof string !== 'string') {
        throw new Error(`stringify returned ${typeof string}`)
      }

      encoded.push({ kind, depth, name, encoded: string })
    } catch (error) {
      const failure = new PayloadValueError('stringify', kind, name, error)

      console.warn(`${failure.message}. The value was left out of the payload, so the client computes it again.`)
      failures.push(failure)
    }
  }

  return { values: encoded, failures }
}

/**
 * Decodes payload values for the store to adopt, each through its own stringifier or the fallback. A
 * value that is missing from the payload or that cannot be read is warned about and left out, so its
 * getter runs again.
 */
export function decodePayloadValues(route: ResolvedRoute, values: PayloadValue[], fallback: PayloadTransformer = jsonTransformer): RouteValue[] {
  const computations = getComputations(route)

  for (const { kind, depth, name } of computations) {
    const present = values.some((value) => value.kind === kind && value.depth === depth && value.name === name)

    if (!present) {
      console.warn(`The payload has no value for ${kind} "${name}". Its getter runs again, which can cause a hydration mismatch.`)
    }
  }

  return values.flatMap(({ kind, depth, name, encoded }) => {
    const transformer = findTransformer(computations, { kind, depth, name }) ?? fallback

    try {
      return [{ kind, depth, name, value: transformer.parse(encoded) as unknown }]
    } catch (error) {
      const failure = new PayloadValueError('parse', kind, name, error)

      console.warn(`${failure.message}. The value was left out, so its getter runs again, which can cause a hydration mismatch.`)

      return []
    }
  })
}

function findTransformer(computations: Computation[], { kind, depth, name }: Pick<PayloadValue, 'kind' | 'depth' | 'name'>): AnyPayloadTransformer | undefined {
  return computations.find((computation) => computation.kind === kind && computation.depth === depth && computation.name === name)?.transformer
}
