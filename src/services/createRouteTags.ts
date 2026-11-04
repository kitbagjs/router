import { createTags } from '@/services/createTags'
import { tagsLocations } from '@/services/tagsLocations'
import { ValueLocation } from '@/types/computation'
import { ResolvedRoute } from '@/types/resolved'
import { isTags, TagLayer, Tags, TagsInternal } from '@/types/tags'

type CreateRouteTagsOptions = {
  route: ResolvedRoute,
  depth: number,
  getValue: (location: ValueLocation<'tags'>) => Promise<unknown>,
}

export function createRouteTags({ route, depth, getValue }: CreateRouteTagsOptions): Tags & TagsInternal {
  async function getParentLayers(): Promise<TagLayer[]> {
    const ancestors = route.matches.slice(0, depth).flatMap(tagsLocations)
    const layers = await Promise.all(ancestors.map((location) => getValue(location))) as TagLayer[]

    return layers
  }

  const tags = createTags({ getParentLayers })

  if (!isTags(tags)) {
    throw new TypeError('Expected tags created by createTags')
  }

  return tags
}
