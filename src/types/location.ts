import { ref, watch } from 'vue'
import { globalExists } from '@/utilities'

export const location = ref<string>()

if (globalExists('document')) {
  watch(location, value => {
    if (value) {
      document.location = value
    }
  })
}

function popStateChanged(event: PopStateEvent): void {
  console.log('popstate', event)
}

function hashChanged(event: HashChangeEvent): void {
  console.log('hashchange', event)
}

if (globalExists('window')) {
  window.addEventListener('popstate', popStateChanged)
  window.addEventListener('hashchange', hashChanged)
}