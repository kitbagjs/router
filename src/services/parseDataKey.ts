import { DataKind } from '@/services/getDataKey'

export type DataKeyParts = [
  routeName: string,
  href: string,
  state: [name: string, value: string | null][],
  depth: number,
  kind: DataKind,
  name: string
]

export function parseDataKey(key: string): DataKeyParts {
  const parts: unknown = JSON.parse(key)

  if (!isDataKeyParts(parts)) {
    throw new TypeError('Invalid data key')
  }

  return parts
}

function isDataKeyParts(value: unknown): value is DataKeyParts {
  if (!Array.isArray(value) || value.length !== 6) {
    return false
  }

  const [routeName, href, state, depth, kind, name] = value

  return typeof routeName === 'string'
    && typeof href === 'string'
    && Array.isArray(state)
    && state.every((entry) => Array.isArray(entry)
      && entry.length === 2
      && typeof entry[0] === 'string'
      && (typeof entry[1] === 'string' || entry[1] === null))
    && typeof depth === 'number'
    && Number.isInteger(depth)
    && depth >= -1
    && (kind === 'props' || kind === 'loader')
    && typeof name === 'string'
}
