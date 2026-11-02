import { TagGroup, TagLayer, TagSelector } from '@/types/tags'

export function matchesTag(group: TagGroup, target: TagSelector): boolean {
  if (group.tag !== target.tag) {
    return false
  }

  return Object.entries(target.attributes).every(([name, value]) => {
    const attribute: unknown = group.attributes[name] ?? (group.tag === 'title' ? undefined : Reflect.get(group.value, name))

    return attribute === value
  })
}

export function mergeTags(layers: readonly TagLayer[]): readonly TagGroup[] {
  let groups: TagGroup[] = []

  for (const layer of layers) {
    for (const operation of layer) {
      if (operation.kind !== 'add') {
        groups = groups.filter((group) => !matchesTag(group, operation.target))
      }

      if (operation.kind !== 'delete') {
        groups.push(...operation.groups)
      }
    }
  }

  return groups
}
