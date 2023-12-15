import { ExtractParamsFromPath, Route, RouteFlat, Routes } from '@/types'

export function routeParamsAreValid(path: string, route: RouteFlat): boolean {
  // each param
  // get string value from string path (param)
  // run that through utilities.getParamValue (if non-simple param)
  // if it throws exception, consider not swallowing

  return true
}