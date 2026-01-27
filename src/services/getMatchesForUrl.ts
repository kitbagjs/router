import { isNamedRoute } from '@/utilities/isNamedRoute'
import { Route, Routes } from '@/types/route'

type Match = {
  score: number,
  route: Route,
}

export function getMatchesForUrl(routes: Routes, url: string): Route[] {
  return routes.reduce<Match[]>((matches, route) => {
    if (!isNamedRoute(route)) {
      return matches
    }

    const score = route.match(url).score
    if (score > 0) {
      matches.push({ score, route })
    }

    return matches
  }, [])
    .sort(sortByRouteScore)
    .map(({ route }) => route)
}

function sortByRouteScore(aRoute: Match, bRoute: Match): number {
  return bRoute.score - aRoute.score
}
