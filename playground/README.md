# View transitions playground

A manual playground for [PR #878](https://github.com/kitbagjs/router/pull/878).
It imports the router directly from this checkout's `src/main.ts`, so library changes
show up in Vite without building or publishing the package.

## Run

Check out `codex/view-transitions-playground`, then run these commands from the
repository root (not from `playground/`):

```sh
git fetch origin
git switch codex/view-transitions-playground
nvm install
nvm use
npm ci
npm run playground:view-transitions
```

If you don't use nvm, use Node 22.14 or newer. Open the local URL printed by Vite
(normally http://localhost:5173). To choose another port:

```sh
npm run playground:view-transitions -- --port 5174
```

Use a browser with `document.startViewTransition` support to see animations; the
header reports whether the API is available. Directional CSS and circle reveal also
need view-transition type support. Without the API, navigation still works but does
not animate. Reduced-motion preferences suppress animations.

This draft branches from `view-transitions`, the branch for #878. Check out the
playground branch itself; the feature does not need to be merged into `main` first.

## Things to try

- **Async props:** from Sync, click Async props and keep clicking the counter during
  the 800ms wait. The old page stays interactive until the destination is ready.
- **Async component / Loader / Everything:** try the delayed component, loader,
  and combined example. Async components are cached after the first load; refresh
  on Sync before repeating the first-load case.
- **Rapid navigation:** click Async props, then Loader before the first finishes.
  The latest destination should win.
- **Header controls:** turn off Animate header links to disable transitions on
  those links. Links inside pages continue to use their route/router defaults.
  Turn on circle reveal to animate the new page with the Web Animations API.
- **Route says no:** the route disables transitions, but the header link's explicit
  navigation option overrides it. Its in-page link has no override and should not
  animate.
- **Gallery:** click a colored square to morph it into the photo. Only the clicked
  square receives the shared transition name. Returning to the gallery cross-fades.
- **Nested:** switch between the children to see the child route's `fade-up` type
  and delayed props.

The header shows pending/animating/idle state and the most recent transition types.

## Validate

From the repository root:

```sh
npx vue-tsc --noEmit -p playground/tsconfig.json
npx vite build --config playground/vite.config.ts
```

The build is written to `playground/dist/` (ignored by Git). The playground uses the
root package's dependencies and has no separate install step.
