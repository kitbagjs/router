import { DataKind, isDataKind } from '@/types/computation'
import { SerializedStateEntry } from '@/types/state'

export type DataKeyParts = [
  routeName: string,
  href: string,
  state: SerializedStateEntry[],
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

  return isString(routeName)
    && isString(href)
    && isStateEntries(state)
    && isDepth(depth)
    && isDataKind(kind)
    && isString(name)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isStateEntries(value: unknown): value is SerializedStateEntry[] {
  return Array.isArray(value) && value.every(isStateEntry)
}

function isStateEntry(value: unknown): value is SerializedStateEntry {
  if (!Array.isArray(value) || value.length !== 2) {
    return false
  }

  const [name, stateValue] = value

  return isString(name) && (isString(stateValue) || stateValue === null)
}

function isDepth(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= -1
}
