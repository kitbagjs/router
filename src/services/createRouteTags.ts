import { createTags } from '@/services/createTags'
import { tagsLocations } from '@/services/getComputations'
import { ValueLocation } from '@/types/computation'
import { CallbackContextResponse } from '@/types/callbackContext'
import { ResolvedRoute } from '@/types/resolved'
import { isTags, TagLayer, Tags, TagsInternal } from '@/types/tags'
import { unwrapComputationResponse } from '@/utilities/unwrapComputationResponse'

type CreateRouteTagsOptions = {
  route: ResolvedRoute,
  depth: number,
  subscribe: (location: ValueLocation<'tags'>) => Promise<CallbackContextResponse>,
}

export function createRouteTags({ route, depth, subscribe }: CreateRouteTagsOptions): Tags & TagsInternal {
  async function getParentLayers(): Promise<TagLayer[]> {
    const ancestors = route.matches.slice(0, depth).flatMap(tagsLocations)
    const responses = await Promise.all(ancestors.map((location) => subscribe(location)))
    const layers: TagLayer[] = []

    for (const response of responses) {
      if (response.status === 'ERROR') {
        continue
      }

      layers.push(unwrapComputationResponse(response) as TagLayer)
    }

    return layers
  }

  const tags = createTags({ getParentLayers })

  if (!isTags(tags)) {
    throw new TypeError('Expected tags created by createTags')
  }

  return tags
}
