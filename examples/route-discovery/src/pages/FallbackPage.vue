<script setup lang="ts">
  import { createLoader, useLoader } from '@kitbag/router'

  const local = createLoader({ load: () => 'This definition was created during setup.' })
  const { data } = await useLoader(local)
</script>

<template>
  <p class="eyebrow">
    Runtime fallback
  </p>
  <h1>Still works.</h1>
  <p class="intro">
    {{ data }} Discovery warns and skips it. The runtime loads it when this component mounts.
  </p>
</template>
