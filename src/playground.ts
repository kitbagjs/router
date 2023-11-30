import { Param, Routes } from '@/types'
import { createRouter, path } from '@/utilities'

const routes = [
  {
    name: 'foo',
    path: path('/foo/:accountId/:workspaceId/:accountId/:?workspaceId', {
      workspaceId: {
        get: value => [Boolean(value)],
        set: value => value.toString(),
      } satisfies Param<[boolean]>,
    }),
    children: [
      {
        name: 'bar',
        path: '/bar/:workspaceId/:?foo',
        children: [
          {
            name: 'child',
            path: '/:test/hello',
          },
        ],
      },
    ],
  },
] as const satisfies Routes

const router = createRouter(routes)

router.routes.foo.bar.child()
