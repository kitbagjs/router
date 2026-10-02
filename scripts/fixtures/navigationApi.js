import { createRouter, createRoute } from '/src/main.ts'
import { createApp, createSSRApp, defineAsyncComponent, h, nextTick, resolveComponent } from 'vue'
import { renderToString } from 'vue/server-renderer'

const results = []
const root = { render: () => h(resolveComponent('RouterView')) }
const component = {
  render: () => h('div', { style: 'height:3000px' }, [
    'page',
    h('button', { id: 'focus-target' }, 'focus'),
    h('div', { id: 'target', style: 'margin-top:1800px' }, 'target'),
  ]),
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function deferred() {
  return Promise.withResolvers()
}

async function wait(check) {
  const until = Date.now() + 3000

  while (!check()) {
    if (Date.now() > until) {
      throw new Error('Timed out waiting for navigation')
    }

    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

async function run(name, test) {
  await test()
  results.push(name)
}

const home = createRoute({ name: 'home', path: '/__navigation', component })
const first = createRoute({ name: 'first', path: '/first', state: { visit: Number }, component })
const second = createRoute({ name: 'second', path: '/second', component })
const redirect = createRoute({ name: 'redirect', path: '/redirect', component })
const fragment = createRoute({ name: 'fragment', path: '/fragment', hash: 'target', component })
let loader
const slow = createRoute({ name: 'slow', path: '/slow', component }).addLoader(() => {
  loader = deferred()
  return loader.promise
})
const router = createRouter([home, first, second, redirect, slow, fragment])
const app = createApp(root)
let blocked = false
let gate
let guards = 0

router.onBeforeRouteEnter(async (to, { abort, push }) => {
  guards++

  if (gate) {
    await gate.promise
  }

  if (blocked) {
    abort()
  }

  if (to.name === 'redirect') {
    push('first')
  }
})
router.onBeforeRouteUpdate((_to, { abort }) => {
  guards++

  if (blocked) {
    abort()
  }
})

try {
  const initialEntry = navigation.currentEntry.key

  app.use(router)
  app.mount('#app')
  await router.start()

  await run('Initial adoption preserves the browser entry', async () => {
    assert(navigation.currentEntry.key === initialEntry, 'Initial entry replaced')
    assert(location.pathname === '/__navigation' && router.route.name === 'home', 'Initial route mismatch')
  })

  await run('Precommit guards hold the URL until approval', async () => {
    gate = deferred()
    const before = guards
    const pending = router.push('first')

    await wait(() => guards > before)
    assert(location.pathname === '/__navigation', 'URL committed before guards')
    gate.resolve()
    gate = undefined
    await pending
    assert(location.pathname === '/first' && router.route.name === 'first', 'Push mismatch')
  })

  await run('Aborted push and replace preserve forward entries', async () => {
    await router.push('second')
    router.back()
    await wait(() => router.route.name === 'first')
    const keys = navigation.entries().map((entry) => entry.key).join()

    blocked = true
    await router.push('slow')
    await router.replace('slow')
    assert(location.pathname === '/first', 'Aborted navigation changed URL')
    assert(navigation.entries().map((entry) => entry.key).join() === keys, 'Forward entries lost')
    blocked = false
  })

  await run('Accepted replace preserves Forward and its entry identity', async () => {
    const forward = navigation.entries().at(-1).key

    await router.replace('/first', { state: { visit: 9 } })
    assert(navigation.canGoForward && navigation.entries().at(-1).key === forward, 'Replace lost Forward')
    router.forward()
    await wait(() => router.route.name === 'second')
    assert(navigation.currentEntry.key === forward, 'Forward entry replaced')
  })

  await run('Aborted Back preserves URL and entry without restoration', async () => {
    await router.push('second')
    const key = navigation.currentEntry.key
    const before = guards

    blocked = true
    router.back()
    await wait(() => guards > before)
    await new Promise((resolve) => setTimeout(resolve, 40))
    assert(location.pathname === '/second' && navigation.currentEntry.key === key, 'Back abort changed the entry')
    assert(router.route.name === 'second', 'Back abort changed the route')
    blocked = false
  })

  await run('Precommit redirects run destination guards', async () => {
    const before = guards

    await router.push('redirect')
    assert(location.pathname === '/first' && router.route.name === 'first', 'Redirect mismatch')
    assert(guards === before + 2, 'Redirect guards not rerun')
  })

  await run('The handler waits for loaders after URL commit', async () => {
    let finished = false
    const pending = router.push('slow').then(() => {
      finished = true
    })

    await wait(() => loader !== undefined)
    assert(location.pathname === '/slow' && !finished, 'Wrong loader timing')
    loader.resolve('ready')
    await pending
    assert(finished, 'Handler did not finish')
  })

  await run('Native fragment scrolling follows rendering', async () => {
    await router.push('/fragment#target')
    assert(scrollY > 0, 'Fragment was not scrolled into view')
  })

  await run('Native Back restores scroll position', async () => {
    window.scrollTo(0, 500)
    const saved = scrollY

    await router.push('second')
    assert(scrollY === 0, 'Push did not reset scroll')
    router.back()
    await wait(() => router.route.name === 'fragment' && scrollY === saved)
  })

  await run('Plain anchors use the same navigation pipeline', async () => {
    const anchor = document.createElement('a')

    anchor.href = '/second'
    document.body.append(anchor)
    anchor.click()
    await wait(() => router.route.name === 'second')
    assert(location.pathname === '/second', 'Anchor route mismatch')
    anchor.remove()
  })

  await run('Superseded guards cannot overwrite the latest route', async () => {
    gate = deferred()
    const previousGate = gate
    const before = guards
    const pending = router.push('first')

    await wait(() => guards > before)
    gate = undefined
    await router.push('second')
    await pending
    previousGate.resolve()
    assert(router.route.name === 'second' && location.pathname === '/second', 'Stale route committed')
  })

  await run('Same-URL traversals preserve distinct native state and entry identity', async () => {
    await router.push('/first', { state: { visit: 1 } })
    await router.push('/first', { state: { visit: 2 } })
    const key = navigation.currentEntry.key
    const before = guards

    blocked = true
    router.back()
    await wait(() => guards > before)
    await new Promise((resolve) => setTimeout(resolve, 40))
    assert(navigation.currentEntry.key === key && navigation.currentEntry.getState().visit === 2, 'Aborted traversal lost state')
    blocked = false
    router.back()
    await wait(() => router.route.state.visit === 1)
  })

  await run('Native focus reset runs when the handler finishes', async () => {
    document.getElementById('focus-target').focus()
    assert(document.activeElement.id === 'focus-target', 'Fixture did not focus its button')
    await router.push('/first', { state: { visit: 3 } })
    assert(document.activeElement === document.body, 'Browser did not reset focus')
  })

  router.stop()
  app.unmount()

  await run('Lazy views and props render before native fragment scrolling', async () => {
    window.history.replaceState(null, '', '/__navigation')
    const view = deferred()
    const props = deferred()
    const lazy = createRoute({
      name: 'lazy',
      path: '/lazy',
      hash: 'target',
      component: defineAsyncComponent(async () => {
        await view.promise
        return component
      }),
    }, () => props.promise)
    const client = createRouter([home, lazy])
    const app = createApp(root)

    app.use(client)
    app.mount('#app')
    await client.start()
    let finished = false
    const pending = client.push('/lazy#target').then(() => {
      finished = true
    })

    await wait(() => location.pathname === '/lazy')
    assert(!finished, 'Handler completed before lazy view and props')
    view.resolve()
    props.resolve({})
    await pending
    assert(document.getElementById('target') && scrollY > 0, 'Lazy fragment was not ready for scrolling')
    client.stop()
    app.unmount()
  })

  await run('SSR and Vue hydration preserve markup, data, entry, title and scroll', async () => {
    window.history.replaceState(null, '', '/__navigation')
    let propsCalls = 0
    let loaderCalls = 0
    const page = createRoute({
      name: 'hydrated',
      path: '/__navigation',
      component: {
        props: ['value'],
        render() {
          return h('div', { style: 'height:3000px' }, this.value)
        },
      },
    }, () => {
      propsCalls++
      return { value: 'server props' }
    }).addLoader(() => {
      loaderCalls++
      return 'server data'
    })
    const server = createRouter([page], { ssr: true, historyMode: 'memory', initialUrl: '/__navigation' })
    const response = await server.render()
    const serverApp = createSSRApp(root)

    assert(response.kind === 'success', 'SSR did not succeed')
    serverApp.use(server)
    const html = await renderToString(serverApp)

    document.getElementById('app').innerHTML = html
    document.body.insertAdjacentHTML('beforeend', response.payload)
    document.title = 'server title'
    window.scrollTo(0, 450)
    const scroll = scrollY
    const entry = navigation.currentEntry.key
    const node = document.getElementById('app').firstElementChild
    let browserNavigations = 0
    const listener = new AbortController()

    navigation.addEventListener('navigate', () => browserNavigations++, listener)
    const client = createRouter([page])
    let beforeCalls = 0

    client.onBeforeRouteEnter(() => beforeCalls++)
    const hydratedApp = createSSRApp(root)

    hydratedApp.use(client)
    assert(client.route.name === 'hydrated', 'Hydration did not adopt the route synchronously')
    hydratedApp.mount('#app')
    await client.start()
    await nextTick()
    assert(document.getElementById('app').firstElementChild === node, 'Hydration replaced server markup')
    assert(await client.route.data === 'server data', 'Hydration did not adopt server data')
    assert(propsCalls === 1 && loaderCalls === 1 && beforeCalls === 0, 'Hydration reran server work')
    assert(browserNavigations === 0 && navigation.currentEntry.key === entry, 'Hydration initiated navigation')
    assert(scrollY === scroll && document.title === 'server title', 'Hydration changed scroll or title')
    listener.abort()
    client.stop()
    server.stop()
    hydratedApp.unmount()
  })

  document.getElementById('results').textContent = JSON.stringify({ passed: results.length, results })
} catch (error) {
  document.getElementById('results').textContent = JSON.stringify({ error: String(error), stack: error.stack, results })
}
