import { Param, Routes, createRouter, path } from "./routes"
import { useRoute } from './compositions/useRoute'
import { useRouteParam } from './compositions/useRouteParam'
import { useParam } from "./compositions/useParam"

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

const route = useRoute<typeof methods.foo.bar>()

route.params.test // correctly errors

const param = useRouteParam(methods.foo.bar, 'foo', 'foo')
const value = useParam<boolean>('foo')