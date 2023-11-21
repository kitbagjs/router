import { Param, Routes, createRouter, path } from "./routes"

const routes = [
  {
      name: 'foo',
      path: '/foo/:accountId',
      children: [
          {
              name: 'bar',
              path: path('/bar/:workspaceId/:?foo', {
                workspaceId: {
                  get: value => Boolean(value),
                  set: value => value.toString()
                } satisfies Param<boolean>
              }),
          }
      ]
  }
] as const satisfies Routes

const methods = createRouter(routes)

methods.foo.bar({
  accountId: '111',
  workspaceId: 'true' // correctly errors!
})