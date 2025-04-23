export default {
  $schema: "https://typedoc.org/schema.json",
  entryPoints: ["./dist/kitbag-router.d.ts"],
  plugin: [
    "typedoc-plugin-markdown",
    "typedoc-vitepress-theme",
  ],
  out: "./docs/api",
  docsRoot: "./docs/",
  tsconfig: "./typedoc.tsconfig.json",
  readme: "none",
  parametersFormat: "table",
  propertiesFormat: "table",
  hideBreadcrumbs: true,
  hidePageHeader: true,
  hideGroupHeadings: true,
  useCodeBlocks: true,
  disableSources: true,
  groupOrder: [
    "Compositions",
    "Errors",
    "Interfaces",
    "Type Guards",
    "Types",
    "Utilities",
    "*",
  ],
  sidebar: {
    pretty: true,
  },
  pageTitleTemplates: {
    member: (args) => `${args.group}: ${args.name}`,
  }
}
