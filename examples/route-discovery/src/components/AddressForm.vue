<script setup lang="ts">
  import { ref } from 'vue'
  import CountrySelect from './CountrySelect.vue'

  const country = ref('US')
</script>

<template>
  <div class="form">
    <label>Street address<input placeholder="123 Market Street"></label>
    <CountrySelect v-model="country" />
  </div>
</template>
