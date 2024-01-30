import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Kitbag Router | Typesafe router for Vue.js",
  description: "Typesafe router for Vue.js",
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
            { text: 'Defining Routes', link: '/core-concepts/' },
            { text: 'Route Params', link: '/core-concepts/route-params' },
            { text: 'Query Params', link: '/core-concepts/query-params' },
            { text: 'Nested Routes', link: '/core-concepts/nested-routes' },
            { text: 'Navigating', link: '/core-concepts/navigating' },
          ],
        },
        {
          text: 'Advanced Concepts',
          items: [
            { text: 'Middleware', link: '/core-concepts/middleware' },
            { text: 'Route Meta', link: '/core-concepts/route-meta' },
            { text: 'Composables', link: '/core-concepts/composables' },
            { text: 'Transitions', link: '/core-concepts/transitions' },
          ],
        },
        {
          text: "Delete this",
          link: "/vitepress-syntax"
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
