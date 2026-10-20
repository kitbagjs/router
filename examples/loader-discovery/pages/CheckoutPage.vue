<script setup lang="ts">
import { useRoute } from '../routerAssets'
import AddressForm from '../components/AddressForm.vue'

const route = useRoute('checkout')
const message = await route.data.manual
</script>

<template>
  <section>
    <h2>Checkout</h2>
    <p>{{ message }}</p>
    <AddressForm />
    <p>The two selects share one request for this navigation:</p>
    <AddressForm />
  </section>
</template>
