import { App } from "vue";
import { Router, Routes } from "./types";
import { setupDevtoolsPlugin } from '@vue/devtools-api'
import { createUniqueIdSequence } from "./services/createUniqueIdSequence";

type DevtoolsPluginContext = {
  app: App,
  router: Router,
  routes: Routes,
}

const getRouterId = createUniqueIdSequence()

export function setupDevtools({ app, router, routes }: DevtoolsPluginContext): void {
  const routerId = getRouterId()
  const pluginId = withIdSuffix('kitbag-router-devtools', routerId)
  const inspectorId = withIdSuffix('kitbag-router', routerId)

  const description = {
    id: pluginId,
    label: withIdSuffix('Kitbag Router', routerId, ' '),
    packageName: '@kitbag/router',
    homepage: 'https://router.kitbag.dev/',
    app,
  }

  setupDevtoolsPlugin(description, (api) => {
    
    api.addInspector({
      id: inspectorId,
      label: withIdSuffix('Routes', routerId, ' '),
      treeFilterPlaceholder: 'Search routes',
    });

    api.on.getInspectorTree((payload) => {
      if(!isInspector(payload)) {
        return
      }

      const filteredRoutes = routes.filter(route => route.name.includes(payload.filter))

      payload.rootNodes = filteredRoutes.map((route) => ({
        id: route.id.toString(),
        label: route.name,
      }));
    });

    api.on.getInspectorState((payload) => {
      if(!isInspector(payload)) {
        return
      }

      const route = routes.find((r) => r.id.toString() === payload.nodeId);

      if(!route) {
        return
      }

      payload.state = {
        details: [
          { key: 'Name', value: route.name, editable: false },
          { key: 'Path', value: route.path.value, editable: false },
          { key: 'Path Params', value: route.path.params, editable: false },
          { key: 'Query', value: route.query.value, editable: false },
          { key: 'Query Params', value: route.query.params, editable: false },
          { key: 'Hash', value: route.hash, editable: false },
          { key: 'Meta', value: route.meta, editable: false },
          { key: 'State', value: route.state, editable: false },
          { key: 'Prefetch', value: route.prefetch, editable: false },
        ],
      };
    });
  })

  function isInspector(payload: { inspectorId: string }): boolean {
    return payload.inspectorId === inspectorId
  }
  
  function withIdSuffix(value: string, routerId: string, separator: string = '-'): string {
    if(routerId === '0') {
      return value
    }

    return `${value}${separator}${routerId}`
  }

}
