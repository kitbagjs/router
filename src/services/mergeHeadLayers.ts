import { HeadGroup, HeadLayer, HeadSelector } from '@/types/headTags'

function matches(group: HeadGroup, target: HeadSelector): boolean {
  if (group.selector.tag !== target.tag) {
    return false
  }

  return Object.entries(target.attributes).every(([name, value]) => {
    const attribute = group.selector.attributes[name] ?? group.elements.at(0)?.attributes[name]

    return attribute === value
  })
}

export function mergeHeadLayers(layers: readonly HeadLayer[]): readonly HeadGroup[] {
  let groups: HeadGroup[] = []

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
