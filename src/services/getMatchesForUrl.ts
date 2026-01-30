import { Route, Routes } from '@/types/route'
import { getRouteScore } from '@/services/getRouteScore'

export function getMatchesForUrl(routes: Routes, url: string): Route[] {
  return routes
    .reduce<[route: Route, score: number][]>((matches, route) => {
      const score = getRouteScore(route, url)
      if (score > 0) {
        matches.push([route, score])
      }
      return matches
    }, [])
    .sort(sortByScoreThenDepth)
    .map(([route]) => route)
}

function sortByScoreThenDepth([aRoute, aScore]: [route: Route, score: number], [bRoute, bScore]: [route: Route, score: number]): number {
  if (aScore === bScore) {
    return bRoute.depth - aRoute.depth
  }

  return bScore - aScore
}
