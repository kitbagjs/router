type Route = {
  name: string,
  params: Record<string, unknown>,
  query: unknown,
  hash: string,
}

interface RouteState {

}

interface RouteRejection {
  NotFound: unknown,
}

type RouteReject = (type?: keyof RouteRejection) => void

type MiddleWareExtras = {
  from: Route,
  state: RouteState,
  reject: RouteReject,
}

export type RouteMiddleware = (route: Route, extras: MiddleWareExtras) => Promise<void> | void

// const test: RouteMiddleware = (_route, { reject }) => {
//   reject()
// }