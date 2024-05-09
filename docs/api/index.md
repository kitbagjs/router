# API Reference

<script setup>
import { useSidebar } from 'vitepress/theme'

const { sidebarGroups } = useSidebar()
</script>

<div v-for="group in sidebarGroups" :key=group.text>
  <h2>{{ group.text }}</h2>

  <ul v-for="item in group.items" :key="item.text">
    <li>
      <a :href="`/api/${group.text.toLowerCase()}/${item.text}`">{{ item.text }}</a>
    </li>
  </ul>
</div>
