import { RouteHooks } from '@/models/RouteHooks'

export class RouteHooksStore {
  public global = new RouteHooks()
  public component = new RouteHooks()
}