Run `node tests/navigation-readiness/server.mjs`, open http://127.0.0.1:4173 in a top-level browser tab and click **Run browser checks**. Results include the Git head, browser version, outgoing DOM, DOM at the view-transition update boundary and at `ready`. The server writes JSON to `/tmp/readiness-results.json` (`BROWSER_RESULTS` overrides it).

This is a real-browser fixture. The `*.browser.spec.ts` unit tests run in Happy DOM and cannot prove snapshot or native scrolling behavior. Coordinate writes in this fixture only seed test positions; production code owns no coordinates.

`?upstream` runs the two compatibility smoke checks against the refreshed view-transitions base. `ROUTER_ROOT` can point the fixture at that checkout. The scope probes intentionally demonstrate that component async setup and app-controlled custom slots are outside route-data preparation.

On the scroll layer, the fixture exercises native restoration alone and with transitions. `?snapshot` hides the old snapshot and holds the new image for 60 seconds; numbered rows and the ready trace verify saved position before animation completion. `?case=async%20tall-to-tall` selects the two tall-destination cases. Failed route data retains the original commit/error semantics and suppresses native restoration.
