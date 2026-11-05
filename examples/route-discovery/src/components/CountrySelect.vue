<script setup lang="ts">
  import { useLoader } from '@kitbag/router'
  import { countries } from '../loaders/countries'

  const country = defineModel<string>()
  const { data: options, loading } = await useLoader(countries)
</script>

<template>
  <label>
    Country
    <select v-model="country" :disabled="loading">
      <option value="">Choose your country</option>
      <option v-for="option in options" :key="option.code" :value="option.code">
        {{ option.name }}
      </option>
    </select>
  </label>
</template>
