// vite.config.js
import { resolve } from "path";
import { defineConfig } from "file:///Users/evansutherland/Development/router/node_modules/vitest/dist/config.js";
import vue from "file:///Users/evansutherland/Development/router/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import dts from "file:///Users/evansutherland/Development/router/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/evansutherland/Development/router";
var vite_config_default = defineConfig({
  test: {
    typecheck: {
      checker: "vue-tsc",
      ignoreSourceErrors: true
    },
    environmentMatchGlobs: [
      ["**/*.browser.spec.ts", "happy-dom"],
      ["**/*.spec.ts", "node"]
    ]
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(__vite_injected_original_dirname, "src")
      }
    ]
  },
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/main.ts"),
      name: "@kitbag/router",
      fileName: "kitbag-router"
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue"
        }
      }
    }
  },
  plugins: [
    vue(),
    dts({
      rollupTypes: true
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZXZhbnN1dGhlcmxhbmQvRGV2ZWxvcG1lbnQvcm91dGVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvZXZhbnN1dGhlcmxhbmQvRGV2ZWxvcG1lbnQvcm91dGVyL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9ldmFuc3V0aGVybGFuZC9EZXZlbG9wbWVudC9yb3V0ZXIvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCdcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGVzdC9jb25maWcnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICB0ZXN0OiB7XG4gICAgdHlwZWNoZWNrOiB7XG4gICAgICBjaGVja2VyOiAndnVlLXRzYycsXG4gICAgICBpZ25vcmVTb3VyY2VFcnJvcnM6IHRydWUsXG4gICAgfSxcbiAgICBlbnZpcm9ubWVudE1hdGNoR2xvYnM6IFtcbiAgICAgIFsnKipcXC8qLmJyb3dzZXIuc3BlYy50cycsICdoYXBweS1kb20nXSxcbiAgICAgIFsnKipcXC8qLnNwZWMudHMnLCAnbm9kZSddLFxuICAgIF1cbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiBbXG4gICAgICB7XG4gICAgICAgIGZpbmQ6ICdAJyxcbiAgICAgICAgcmVwbGFjZW1lbnQ6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjJyksXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgbGliOiB7XG4gICAgICBlbnRyeTogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvbWFpbi50cycpLFxuICAgICAgbmFtZTogJ0BraXRiYWcvcm91dGVyJyxcbiAgICAgIGZpbGVOYW1lOiAna2l0YmFnLXJvdXRlcicsXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogWyd2dWUnXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAgdnVlOiAnVnVlJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIGR0cyh7IFxuICAgICAgcm9sbHVwVHlwZXM6IHRydWUgXG4gICAgfSlcbiAgXSxcbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwUyxTQUFTLGVBQWU7QUFDbFUsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sU0FBUztBQUhoQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsSUFDSixXQUFXO0FBQUEsTUFDVCxTQUFTO0FBQUEsTUFDVCxvQkFBb0I7QUFBQSxJQUN0QjtBQUFBLElBQ0EsdUJBQXVCO0FBQUEsTUFDckIsQ0FBQyx3QkFBeUIsV0FBVztBQUFBLE1BQ3JDLENBQUMsZ0JBQWlCLE1BQU07QUFBQSxJQUMxQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixhQUFhLFFBQVEsa0NBQVcsS0FBSztBQUFBLE1BQ3ZDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLEtBQUs7QUFBQSxNQUNILE9BQU8sUUFBUSxrQ0FBVyxhQUFhO0FBQUEsTUFDdkMsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLElBQ1o7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFVBQVUsQ0FBQyxLQUFLO0FBQUEsTUFDaEIsUUFBUTtBQUFBLFFBQ04sU0FBUztBQUFBLFVBQ1AsS0FBSztBQUFBLFFBQ1A7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxJQUNKLElBQUk7QUFBQSxNQUNGLGFBQWE7QUFBQSxJQUNmLENBQUM7QUFBQSxFQUNIO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
