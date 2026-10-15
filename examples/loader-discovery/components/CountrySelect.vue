<script lang="ts">
import { defineLoader } from 'virtual:kitbag-loader-macros'
import { getCountries } from '../api'

export const countries = defineLoader(() => getCountries(), { prefetch: 'intent' })
</script>

<script setup lang="ts">
import { record } from '../events'

record('CountrySelect setup: awaiting the existing countries promise')
const options = await countries
record('CountrySelect setup: data available')
</script>

<template>
  <label>
    Country
    <select data-testid="countries">
      <option v-for="country in options" :key="country.code" :value="country.code">
        {{ country.name }}
      </option>
    </select>
  </label>
</template>
