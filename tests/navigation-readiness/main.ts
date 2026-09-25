import { createApp, defineAsyncComponent, defineComponent, h, nextTick, onMounted, Suspense } from 'vue'
import { createRouter, createRoute, RouterView } from '@/main'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const results: object[] = []
const snapshots: object[] = []
const head = await fetch('/__head').then(response => response.text())
const snapshotProof = new URLSearchParams(location.search).has('snapshot')
const selected = new URLSearchParams(location.search).get('case')
const upstream = new URLSearchParams(location.search).has('upstream')
let app: ReturnType<typeof createApp>
let router: ReturnType<typeof createRouter>
let propsDelay = 100
let loaderDelay = 350
let mode = 'success'
let mounts = 0
let loaderDone = false
let errors: string[] = []

window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)))
const originalStart = document.startViewTransition.bind(document)
document.startViewTransition = ((options: UpdateCallback | StartViewTransitionOptions) => {
  const update = typeof options === 'function' ? options : options.update!
  const record = { old: state(), update: null as object | null, ready: null as object | null, readyError: '' }
  snapshots.push(record)
  const transition = originalStart({ ...(typeof options === 'function' ? {} : options), update: async () => {
    await update()
    record.update = state()
  } })
  transition.ready.then(() => record.ready = state(), error => record.readyError = String(error))
  return transition
}) as Document['startViewTransition']

function state() { return { url: location.pathname, view: document.querySelector('[data-view]')?.getAttribute('data-view'), y: scrollY, loaderDone } }
function assert(condition: unknown, message: string) { if (!condition) throw new Error(message) }
async function until(check: () => boolean, label: string) {
  const end = performance.now() + 5000
  while (!check()) { if (performance.now() > end) throw new Error(`Timed out: ${label}`); await sleep(20) }
}
async function view(id: string) { await until(() => Boolean(document.querySelector(`[data-view="${id}"]`)), `view ${id}`) }
async function settled() { await nextTick(); await sleep(100) }
async function finish() { await router.viewTransition.transition?.finished; await settled() }
async function position(y: number) { scrollTo({ top: y, behavior: 'instant' }); await settled(); assert(scrollY === y, `Seeding ${y}: got ${scrollY}`) }

const Tall = defineComponent({
  props: ['id'],
  setup(props) {
    onMounted(() => mounts++)
    return () => h('div', { 'data-view': props.id, style: 'height:5000px;background:linear-gradient(#cce,#9c9);padding-top:160px' }, Array.from({ length: 50 }, (_, row) => h('div', { style: 'height:100px;border-top:1px solid #555;box-sizing:border-box' }, `List ${props.id} · row ${row} · document y=${160 + row * 100}`)))
  },
})
const Detail = { render: () => h('div', { 'data-view': 'detail', style: 'height:4000px;background:#fdd;padding-top:160px' }, 'Detail') }
async function setup(options: { transition?: boolean, lazy?: boolean, asyncSetup?: boolean, custom?: boolean, scroll?: boolean } = {}) {
  router?.stop()
  app?.unmount()
  propsDelay = 100; loaderDelay = 350; mode = 'success'; mounts = 0; loaderDone = false; errors = []
  const AsyncSetup = defineComponent({ async setup() { await sleep(600); return () => h(Tall, { id: '1' }) } })
  const list = createRoute({ name: 'list', path: '/list/[id]', component: options.lazy ? defineAsyncComponent(async () => { await sleep(250); return Tall }) : options.asyncSetup ? AsyncSetup : Tall }, async (route, context) => {
    await sleep(propsDelay)
    if (mode === 'props-error') throw new Error('props failed')
    if (mode === 'props-reject') throw context.reject('NotFound')
    return { id: route.params.id }
  }).addLoader(async () => {
    await sleep(loaderDelay)
    if (mode === 'loader-error') throw new Error('loader failed')
    loaderDone = true
    return 'loaded independently of props'
  })
  list.onBeforeRouteEnter(async (_to, context) => {
    if (mode === 'guard-delay') await sleep(250)
    if (mode === 'abort') throw context.abort()
    if (mode === 'reject') throw context.reject('NotFound')
    if (mode === 'redirect') throw context.push('/other')
    if (mode === 'guard-error') throw new Error('guard failed')
  })
  router = createRouter([list, createRoute({ name: 'detail', path: '/detail', component: Detail }, async () => { await sleep(propsDelay); return {} }), createRoute({ name: 'other', path: '/other', component: Detail }), createRoute({ name: 'broken', path: '/broken', component: defineAsyncComponent(async () => { await sleep(100); throw new Error('chunk failed') }) })], {
    initialUrl: '/list/1', viewTransition: options.transition ?? true,
    // The stacked scroll PR adds this opt-in; ignored on the shared-readiness head.
    ...options.scroll && { scrollRestoration: true },
  })
  router.onError(error => { if (mode === 'guard-error') throw new Error('Unhandled guard error', { cause: error }) })
  const render = () => options.custom ? h(RouterView, null, { default: () => h('div', { 'data-view': 'custom' }, 'Application-owned slot') }) : h(RouterView)
  app = createApp({ render: () => options.asyncSetup ? h(Suspense, null, { default: render }) : render() })
  app.config.errorHandler = error => errors.push(String(error))
  app.use(router); app.mount('#app')
  await view(options.custom ? 'custom' : '1'); await until(() => loaderDone, 'initial loader'); await settled()
  snapshots.length = 0
}
async function run(name: string, callback: () => Promise<unknown>) {
  if (selected && !name.includes(selected)) return
  try {
    const detail = await callback()
    assert(errors.length === 0, `Unhandled: ${errors.join(', ')}`)
    results.push({ name, pass: true, detail, ...state(), snapshots: [...snapshots] })
  } catch (error) { results.push({ name, pass: false, error: String(error), ...state(), snapshots: [...snapshots], errors: [...errors] }) }
  await save()
}
async function save() {
  const data = { head, browser: navigator.userAgent, upstream, results }
  document.querySelector('#results')!.textContent = `${results.filter((r: any) => r.pass).length}/${results.length} passed · ${head.slice(0, 12)}\n` + results.map((r: any) => `${r.pass ? '✓' : '✗'} ${r.name}${r.error ? ': ' + r.error : ''}${r.detail ? '\n  ' + JSON.stringify(r.detail) : ''}`).join('\n')
  await fetch('/__results', { method: 'POST', body: JSON.stringify(data, null, 2) })
}

async function transitionChecks() {
  await run('transition prepares independent slow loader + async props while retaining outgoing DOM', async () => {
    await setup(); await router.push('/detail'); await finish(); await position(640)
    loaderDone = false
    const pushing = router.push('/list/1')
    await sleep(200)
    assert(state().view === 'detail' && scrollY === 640, 'Outgoing view disappeared during loader preparation')
    await pushing; await view('1'); await finish()
    const snapshot: any = snapshots.at(-1)
    assert(snapshot.update.view === '1' && snapshot.update.loaderDone, 'Destination not ready at update completion')
    assert(snapshot.ready.view === '1', 'New snapshot had wrong DOM')
    return snapshot
  })
  await run('lazy route module and reused parameterized view flush before transition snapshot', async () => {
    await setup({ lazy: true }); await router.push('/list/2'); await finish()
    const before = mounts
    await router.push('/list/1'); await finish()
    assert(mounts === before, 'Reused route remounted')
    assert((snapshots.at(-1) as any).ready.view === '1', 'Reused props missed snapshot')
    return { mounts }
  })
  if (upstream) return
  await run('props rejection retains the existing commit and rejection handling', async () => {
    await setup(); await router.push('/detail'); await finish(); snapshots.length = 0
    mode = 'props-reject'
    await router.push('/list/1'); await finish()
    assert(document.querySelector('#app')!.textContent === 'NotFound', 'Missing rejection')
    assert(snapshots.length === 1, 'Existing transition commit behavior changed')
  })
  await run('stop prevents a late prepared navigation from committing', async () => {
    await setup(); await router.push('/detail'); await finish(); loaderDelay = 700
    const pending = router.push('/list/1'); await sleep(80); router.stop(); await pending
    assert(state().view === 'detail', 'Stopped destination rendered')
  })
  await run('scope probe: async setup under application Suspense exceeds route preparation', async () => {
    await setup({ asyncSetup: true }); await router.push('/detail'); await finish()
    await router.push('/list/1'); await finish()
    const snapshot: any = snapshots.at(-1)
    assert(snapshot.update.view !== '1', 'Probe no longer demonstrates the documented async-setup limit')
    await view('1')
    return { atUpdate: snapshot.update.view ?? 'empty', final: state().view, supported: false }
  })
  await run('scope probe: custom RouterView slots own their rendered content', async () => {
    await setup({ custom: true }); await router.push('/detail'); await finish()
    assert((snapshots.at(-1) as any).ready.view === 'custom', 'Custom slot probe changed')
    return { supported: false, view: state().view }
  })
}

document.querySelector('#run')!.addEventListener('click', async () => {
  const button = document.querySelector<HTMLButtonElement>('#run')!
  button.disabled = true
  results.length = 0
  if (snapshotProof) { await captureSnapshot(); button.disabled = false; return }
  await transitionChecks()
  await scrollChecks()
  button.disabled = false
})

async function expected(y: number) {
  await until(() => Math.abs(scrollY - y) < 2 && !navigation.transition, `scroll ${y}; got ${scrollY}`)
  await finish()
  assert(Math.abs(scrollY - y) < 2, `Expected ${y}, got ${scrollY}`)
  return scrollY
}
async function leave() { await position(1800); await router.push('/detail'); await view('detail'); await finish(); await position(640) }

async function scrollChecks() {
  for (const transition of [false, true]) {
    const label = transition ? 'scroll + transitions' : 'scroll only'
    await run(`${label}: async tall-to-tall Back/Forward and native position at new snapshot`, async () => {
      await setup({ scroll: true, transition }); await leave(); loaderDone = false
      history.back(); await sleep(200)
      assert(state().view === 'detail' && scrollY === 640, 'Outgoing document collapsed while preparing Back')
      await view('1'); const backY = await expected(1800)
      const backSnapshot: any = snapshots.at(-1)
      if (transition) assert(backSnapshot.ready.y === 1800, 'Back position missed new snapshot')
      history.forward(); await view('detail'); const forwardY = await expected(640)
      const forwardSnapshot: any = snapshots.at(-1)
      if (transition) assert(forwardSnapshot.ready.y === 640, 'Forward position missed new snapshot')
      return { backY, forwardY, nativeMode: history.scrollRestoration }
    })
    await run(`${label}: repeated identical URLs keep distinct saved entries`, async () => {
      await setup({ scroll: true, transition }); await position(1800)
      await router.push('/list/1'); await view('1'); await finish(); await sleep(450); await position(800)
      await router.push('/detail'); await view('detail'); await finish(); await position(640)
      history.back(); await view('1'); const newer = await expected(800)
      history.back(); await sleep(450); const older = await expected(1800)
      history.forward(); await sleep(450); const forward = await expected(800)
      if (transition) assert((snapshots.at(-1) as any).ready.y === 800, 'Repeated entry missed snapshot')
      return { newer, older, forward }
    })
    await run(`${label}: reused view keeps its instance and waits for async props`, async () => {
      await setup({ scroll: true, transition, lazy: true }); await position(1800)
      await router.push('/list/2'); await view('2'); await finish(); await position(800)
      const before = mounts
      history.back(); await view('1'); await expected(1800)
      assert(mounts === before, 'Reused view remounted')
      return { mounts }
    })
    await run(`${label}: Forward supersedes delayed Back`, async () => {
      await setup({ scroll: true, transition }); await leave(); propsDelay = 700; loaderDelay = 1000
      history.back(); await sleep(80); history.forward(); await view('detail'); await expected(640); await sleep(1100)
      assert(location.pathname === '/detail' && state().view === 'detail' && scrollY === 640, 'Stale Back restored')
    })
    await run(`${label}: a delayed successful guard restores`, async () => {
      await setup({ scroll: true, transition }); await leave(); mode = 'guard-delay'
      history.back(); await view('1'); return expected(1800)
    })
    for (const outcome of ['abort', 'redirect', 'reject', 'guard-error', 'props-error', 'loader-error']) {
      await run(`${label}: ${outcome} releases interception without restoring mismatched DOM`, async () => {
        await setup({ scroll: true, transition }); await leave(); mode = outcome
        history.back(); await sleep(900)
        await until(() => !navigation.transition, 'failed interception to end')
        if (outcome === 'reject') assert(document.querySelector('#app')!.textContent === 'NotFound', 'Missing rejection')
        else {
          if (!['props-error', 'loader-error'].includes(outcome)) assert(state().view === 'detail', 'Guard changed the destination view')
          assert(scrollY !== 1800, 'Mismatched view restored')
        }
        assert(location.pathname === (outcome === 'redirect' ? '/other' : '/list/1'), 'Unexpected postcommit URL')
        return { urlCommitted: location.pathname }
      })
    }
    await run(`${label}: unmount cancels pending restoration`, async () => {
      await setup({ scroll: true, transition }); await leave(); loaderDelay = 1400
      history.back(); await sleep(100); app.unmount()
      await until(() => !navigation.transition, 'unmounted traversal to end')
      return { interceptionPending: Boolean(navigation.transition) }
    })
  }
}

async function captureSnapshot() {
  await setup({ scroll: true, transition: true }); await leave()
  const style = document.createElement('style')
  style.textContent = '::view-transition-old(root){display:none}::view-transition-new(root){animation:none}::view-transition-group(root){animation-duration:60s}'
  document.head.append(style)
  history.back(); await view('1')
  await router.viewTransition.transition!.ready
  results.push({ name: 'Visible new snapshot at native-restored position', pass: scrollY === 1800, ...state(), animationRunning: document.getAnimations().some(animation => animation.playState === 'running'), snapshots: [...snapshots] })
  await save()
}
