import { defineConfig } from 'vitepress'
import typedocSidebar from '../api/typedoc-sidebar.json';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Kitbag Router | Type safe router for Vue.js",
  description: "Type safe router for Vue.js",
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
  themeConfig: {
    logo: '/kitbag-logo-circle.svg',
    siteTitle: 'Kitbag Router',

    editLink: {
      pattern: 'https://github.com/kitbagjs/router/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },
    
    nav: [
      { text: 'Guide', link: '/introduction' },
      { text: 'API', link: '/api/index' }
    ],

    search: {
      provider: 'local'
    },

    sidebar: {
      '/api/': typedocSidebar,
      '/': [
        {
          text: 'Getting Started',
          items: [
            {
              text: 'Introduction',
              link: '/introduction',
            },
            {
              text: 'Quick Start',
              link: '/quick-start',
            },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Defining Routes', link: '/core-concepts/defining-routes' },
            { text: 'Route Params', link: '/core-concepts/route-params' },
            { text: 'Query Params', link: '/core-concepts/query-params' },
            { text: 'Component Props', link: '/core-concepts/component-props' },
            { text: 'Navigating', link: '/core-concepts/navigating' },
            { text: 'Composables', link: '/core-concepts/composables' },
          ],
        },
        {
          text: 'Advanced Concepts',
          items: [
            { text: 'Route Matching', link: '/advanced-concepts/route-matching' },
            { text: 'Route Narrowing', link: '/advanced-concepts/route-narrowing' },
            { text: 'Rejections', link: '/advanced-concepts/rejections' },
            { text: 'Hooks', link: '/advanced-concepts/hooks' },
            { text: 'Route Meta', link: '/advanced-concepts/route-meta' },
            { text: 'Route State', link: '/advanced-concepts/route-state' },
            { text: 'Transitions', link: '/advanced-concepts/transitions' },
            { text: 'Prefetching', link: '/advanced-concepts/prefetching' },
          ],
        },
        {
          text: "Migrating from vue-router",
          link: "/migrating-vue-router"
        }
      ]
    },

    socialLinks: [
      {
        icon: {
          svg: `<svg fill="#000000" height="800px" width="800px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
          viewBox="0 0 330.242 330.242" xml:space="preserve">
       <path d="M324.442,129.811l-41.321-33.677V42.275c0-6.065-4.935-11-11-11h-26c-6.065,0-11,4.935-11,11v14.737l-55.213-44.999
         c-3.994-3.254-9.258-5.047-14.822-5.047c-5.542,0-10.781,1.782-14.753,5.019L5.8,129.81c-6.567,5.351-6.173,10.012-5.354,12.314
         c0.817,2.297,3.448,6.151,11.884,6.151h19.791v154.947c0,11.058,8.972,20.053,20,20.053h62.5c10.935,0,19.5-8.809,19.5-20.053
         v-63.541c0-5.446,5.005-10.405,10.5-10.405h42c5.238,0,9.5,4.668,9.5,10.405v63.541c0,10.87,9.388,20.053,20.5,20.053h61.5
         c11.028,0,20-8.996,20-20.053V148.275h19.791c8.436,0,11.066-3.854,11.884-6.151C330.615,139.822,331.009,135.161,324.442,129.811z"
         />
       </svg>`
        },
        link: 'https://kitbag.dev',
        ariaLabel: 'Kitbag Home'
      },
      { icon: 'github', link: 'https://github.com/kitbagjs/router' },
      { icon: 'discord', link: 'https://discord.gg/zw7dpcc5HV' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@kitbag/router' },
    ]
  },
  markdown: {
    image: {
      lazyLoading: true
    }
  }
})
