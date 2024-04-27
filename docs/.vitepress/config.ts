import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Kitbag Router | Type safe router for Vue.js",
  description: "Type safe router for Vue.js",
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
  themeConfig: {
    logo: '/kitbag-logo-circle.svg',
    siteTitle: 'Kitbag Router',
    
    nav: [
      { text: 'Guide', link: '/core-concepts' },
      { text: 'API', link: '/api' }
    ],

    search: {
      provider: 'local'
    },

    sidebar: {
      '/api/': [
        {
          text: 'packages',
          items: [
            { text: '@kitbag/router', link: '/api/modules/kitbag' },
          ],
        },
      ],
      '/': [
        {
          text: 'Introduction',
          items: [
            {
              text: 'Introduction',
              link: '/introduction',
            },
            {
              text: 'Getting Started',
              link: '/getting-started',
            },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Defining Routes', link: '/core-concepts/defining-routes' },
            { text: 'Route Params', link: '/core-concepts/route-params' },
            { text: 'Query Params', link: '/core-concepts/query-params' },
            { text: 'Navigating', link: '/core-concepts/navigating' },
          ],
        },
        {
          text: 'Advanced Concepts',
          items: [
            { text: 'Route Matching', link: '/advanced-concepts/route-matching' },
            { text: 'Rejections', link: '/advanced-concepts/rejections' },
            { text: 'Hooks', link: '/advanced-concepts/hooks' },
            { text: 'Route Meta', link: '/advanced-concepts/route-meta' },
            { text: 'Composables', link: '/advanced-concepts/composables' },
            { text: 'Transitions', link: '/advanced-concepts/transitions' },
          ],
        },
        {
          text: "Migrating from vue-router",
          link: "/migrating-vue-router"
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kitbagjs/router' }
    ]
  }
})
