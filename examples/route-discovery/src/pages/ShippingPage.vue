<script setup lang="ts">
  import { useLoader } from '@kitbag/router'
  import { countries } from '../loaders/shippingCountries'

  const { data: options } = await useLoader(countries)
</script>

<template>
  <p class="eyebrow">
    Import name conflicts
  </p>
  <h1>Shipping countries</h1>
  <p class="intro">
    Shipping and billing each export a different loader named countries.
    Their shared generated route file imports them as countries_1 and countries_2.
    Both routes still register their loader as countries.
  </p>
  <label>
    Shipping country
    <select>
      <option v-for="country in options" :key="country" :value="country">{{ country }}</option>
    </select>
  </label>
</template>
