import { Param, Routes, createRouter, path } from "./routes"
import { useRoute } from './compositions/useRoute'
import { useRouteParam } from './compositions/useRouteParam'
import { useParam } from "./compositions/useParam"

const routes = [
  {
      name: 'foo',
      path: path('/foo/:accountId/:workspaceId', {
        workspaceId: {
          get: value => Boolean(value),
          set: value => value.toString()
        } satisfies Param<boolean>
      }),
      children: [
          {
              name: 'bar',
              path: '/bar/:workspaceId/:?foo',
              children: [
                {
                  name: 'child',
                  path: '/:test/hello'
                }
              ]
          }
      ]
  }
] as const satisfies Routes

const router = createRouter(routes)

// router.foo.bar.child({
//   accountId: '111',
//   workspaceId: 'true' // correctly errors!
// })

// const route = useRoute<typeof methods.foo.bar>()

// route.params.test // correctly errors

// const param = useRouteParam(methods.foo.bar, 'foo', 'foo')
// const value = useParam<boolean>('foo')

const route = {
  name: 'foo',
  path: '/foo',
  middleware: [MiddleWare, {
    ware: SecondMiddleWare,
    children: [],
    type: 'concurrent'
  }]
}