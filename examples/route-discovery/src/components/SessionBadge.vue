<script setup lang="ts">
  import { useLoader } from '@kitbag/router'
  import { session } from '../loaders/session'

  const { data: user } = await useLoader(session)
</script>

<template><span class="badge">Signed in as {{ user.name }}</span></template>
