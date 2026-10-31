import { TagGroup, TagLayer, TagSelector } from '@/types/tags'

function matches(group: TagGroup, target: TagSelector): boolean {
  if (group.selector.tag !== target.tag) {
    return false
  }

  return Object.entries(target.attributes).every(([name, value]) => {
    const attribute = group.selector.attributes[name] ?? group.elements.at(0)?.attributes[name]

    return attribute === value
  })
}

export function mergeTags(layers: readonly TagLayer[]): readonly TagGroup[] {
  let groups: TagGroup[] = []

  for (const layer of layers) {
    for (const operation of layer) {
      if (operation.kind !== 'add') {
        groups = groups.filter((group) => !matches(group, operation.target))
      }

      if (operation.kind !== 'delete') {
        groups.push(...operation.groups)
      }
    }
  }

  return Object.freeze(groups)
}
