---
name: arcgis-rules
description: Enforces ArcGIS non-negotiable rules for this project. Use when adding ArcGIS components, modifying vite.config.ts, working with scene initialization, or creating new map-viewer features.
---

# ArcGIS Non-Negotiable Rules

These rules must be followed for every ArcGIS-related change. Violations break the app.

## Rules

1. **Vite exclude** — All `@arcgis/*` and `@esri/*` packages must be in `optimizeDeps.exclude` in `vite.config.ts`. Vite pre-bundling breaks ArcGIS initialisation.

2. **Import components individually** — e.g. `import '@arcgis/map-components/components/arcgis-scene'` before use in JSX. See `src/App.tsx`.

3. **Await `viewOnReady()`** — Get a ref on `<arcgis-scene>`, then inside `useEffect` await `sceneEl.viewOnReady()` before accessing `map`, `allLayers`, or any analysis APIs.

4. **Scene item-id** — The scene loads via `item-id="f477c289e93347aba6a0c052bfe0e0a4"`. Do not set `basemap` alongside `item-id`.

5. **New widget types** — Add JSX intrinsic element declarations to `src/types.d.ts` before using any new ArcGIS or calcite web component.

6. **Stylesheet** — `@arcgis/core/assets/esri/themes/light/main.css` imported once in `main.tsx`.

## Scene Initialization Pattern

```tsx
const sceneRef = useRef<HTMLElement>(null)

useEffect(() => {
  const sceneEl = sceneRef.current
  if (!sceneEl) return
  
  const setup = async () => {
    const view = await sceneEl.viewOnReady()
    // Now safe to access view.map, view.allLayers, view.analyses
  }
  
  setup().catch(console.error)
}, [])
```

## Vite Config (Non-Negotiable)

```ts
export default defineConfig({
  optimizeDeps: {
    exclude: [
      '@arcgis/core',
      '@arcgis/map-components',
      '@arcgis/charts-components',
      '@esri/calcite-components',
    ],
  },
})
```

## Type Declarations

New ArcGIS widgets require manual JSX intrinsic element declarations in `src/types.d.ts`:

```ts
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'arcgis-scene': ArcgisSceneProps
      'arcgis-building-explorer': ArcgisBuildingExplorerProps
      // Add new widgets here before use
    }
  }
}
```

## Analysis Tools Reference

| Tool | ArcGIS API | Use Case |
|---|---|---|
| Area Measurement | `AreaMeasurementAnalysis` | Measure plot area |
| Direct Line Measurement | `DirectLineMeasurementAnalysis` | Measure distances |
| Line of Sight | `LineOfSightAnalysis` | Visibility checks |
| Viewshed | `ViewshedAnalysis` | Radar viewshed, visibility cones |
| Dimension | `DimensionAnalysis` | Building height measurements |
| Slice | `SliceAnalysis` | Cross-section analysis |

## GIS Layers

| Layer | Type | Source |
|---|---|---|
| Proposed building | Scene Layer (multipatch) | iEP Scene service |
| Surrounding buildings | Scene Layer (LOD2) | iEP ArcGIS Portal |
| OLS surfaces | Scene Layer (multipatch) | iEP ArcGIS Portal |
| ILS technical templates | Scene Layer (multipatch) | iEP ArcGIS Portal |
| Composite Height Templates | Scene Layer (multipatch) | iEP ArcGIS Portal |
