import { Routes } from '@/types/routes'

export const random = {
  number(options: { min?: number, max?: number } = {}): number {
    const { min, max } = { min: 0, max: 1, ...options }
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min

    return randomNumber
  },
}

export const component = { template: '<div>This is component</div>' }

export const routes = [
  {
    name: 'parentA',
    path: '/:paramA',
    children: [
      {
        name: 'childA',
        path: '/:?paramB',
        children: [
          {
            name: 'grandChildA',
            path: '/:paramC',
            component,
          },
        ],
      },
      {
        name: 'childB',
        path: '/:paramD',
        component,
      },
    ],
  },
  {
    name: 'parentB',
    path: '/parentB',
    component,
  },
] as const satisfies Routes