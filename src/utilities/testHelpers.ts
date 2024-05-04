import { createRoutes } from '@/services/createRoutes'

export const random = {
  number(options: { min?: number, max?: number } = {}): number {
    const { min, max } = { min: 0, max: 1, ...options }
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min

    return randomNumber
  },
}

export const component = { template: '<div>This is component</div>' }

export const routes = createRoutes([
  {
    name: 'parentA',
    path: '/:paramA',
    children: createRoutes([
      {
        name: 'childA',
        path: '/:?paramB',
        children: createRoutes([
          {
            name: 'grandChildA',
            path: '/:paramC',
            component,
          },
        ]),
      },
      {
        name: 'childB',
        path: '/:paramD',
        component,
      },
    ]),
  },
  {
    name: 'parentB',
    path: '/parentB',
    component,
  },
])