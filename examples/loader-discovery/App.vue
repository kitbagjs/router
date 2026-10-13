<script setup lang="ts">
import { RouterLink, RouterView } from './routerAssets'
import manifest from './.kitbag/manifest.generated'
import { events } from './events'
import { router } from './router'

const links = [
  { label: 'Home', to: router.resolve('home') },
  { label: 'Checkout · hover to prefetch', to: router.resolve('checkout') },
  { label: 'Profile', to: router.resolve('profile') },
]
</script>

<template>
  <main>
    <h1>Discover loaders, keep ordinary routes</h1>
    <p>Every route uses createRoute. Only CountrySelect declares a macro.</p>
    <nav>
      <RouterLink v-for="link in links" :key="link.to.name" :to="link.to">{{ link.label }}</RouterLink>
    </nav>
    <Suspense>
      <RouterView />
      <template #fallback><p>Awaiting loader data…</p></template>
    </Suspense>
    <aside>
      <h2>Request timeline</h2>
      <p v-if="!events.length">No requests yet.</p>
      <ol><li v-for="(event, index) in events" :key="index"><time>{{ event.time }}</time> {{ event.message }}</li></ol>
    </aside>
    <details>
      <summary>Discovered ownership and generated route code</summary>
      <div v-for="file in manifest" :key="file.file">
        <pre>{{ JSON.stringify(file.routes, null, 2) }}</pre>
        <pre>{{ file.generated }}</pre>
      </div>
    </details>
  </main>
</template>

<style>
body { margin: 0; color: #19263a; background: #f4f6f9; font: 16px/1.6 system-ui, sans-serif; }
main { max-width: 950px; margin: 48px auto; padding: 0 24px; }
h1 { line-height: 1.2; }
nav { display: flex; flex-wrap: wrap; gap: 20px; margin: 24px 0; }
a { color: #315ca9; }
section, aside, details { padding: 24px; margin-top: 24px; background: white; border: 1px solid #dce2eb; border-radius: 12px; }
h2 { margin-top: 0; }
label { display: grid; gap: 8px; max-width: 320px; }
select { font: inherit; padding: 8px; }
time { color: #68778e; font-variant-numeric: tabular-nums; }
pre { overflow-x: auto; font-size: 12px; }
</style>
