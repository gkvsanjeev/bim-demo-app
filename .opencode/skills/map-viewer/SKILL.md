---
name: map-viewer
description: Implements the ArcGIS 3D map viewer with panels, tools, and analysis features. Use when creating map-viewer components, adding analysis tools, or modifying the scene layout.
---

# Map Viewer — SkySAFE 2.0

Interactive 3D ArcGIS Scene with building explorer, layer controls, basemap gallery, coordinate conversion, and measurement tools.

## Route

| Path | Component | Roles |
|---|---|---|
| `/map/:applicationId` | App (ArcGIS Scene) | `caas_io`, `adp_ao` |

## Component Layout

```
src/features/map-viewer/
├── App.tsx                    # ArcGIS scene + layout shell
├── AppHeader.tsx              # Header bar on map view
├── RightToolbar.tsx           # Icon strip (basemap, building explorer, tools)
├── AssessmentPanel.tsx        # Run iEP compliance checks
├── RadarViewshedPanel.tsx     # Radar line-of-sight analysis
├── SceneToolsPanel.tsx        # Measurement tools (area, line, viewshed, etc.)
├── LayersPanel.tsx            # Layer visibility toggles
├── BasemapPanel.tsx           # Basemap gallery
├── SearchPanel.tsx            # Location search
└── CoordinateConversionTool.tsx # CRS conversion widget
```

## Scene Initialization

```tsx
const sceneRef = useRef<HTMLElement>(null)

useEffect(() => {
  const sceneEl = sceneRef.current
  if (!sceneEl) return
  
  const setup = async () => {
    const view = await sceneEl.viewOnReady()
    // Now safe to access view.map, view.allLayers, view.analyses
    view.ui.padding = { top: 50, right: 44 } // Avoid overlap with header/toolbar
  }
  
  setup().catch(console.error)
}, [])
```

## ArcGIS Web Components to Import

```tsx
import '@arcgis/map-components/components/arcgis-scene'
import '@arcgis/map-components/components/arcgis-zoom'
import '@arcgis/map-components/components/arcgis-navigation-toggle'
import '@arcgis/map-components/components/arcgis-compass'
import '@arcgis/map-components/components/arcgis-building-explorer'
import '@arcgis/map-components/components/arcgis-basemap-gallery'
import '@arcgis/map-components/components/arcgis-layer-list'
import '@arcgis/map-components/components/arcgis-legend'
import '@arcgis/map-components/components/arcgis-coordinate-conversion'
```

## Scene Configuration

- `item-id="f477c289e93347aba6a0c052bfe0e0a4"` — The 3D scene
- Do NOT set `basemap` alongside `item-id`
- `view.ui.padding` prevents overlap with custom header (50px) and toolbar (44px)

## Analysis Tools

### SceneToolsPanel

6 analysis tools using ArcGIS core APIs:

| Tool | ArcGIS API | Use Case |
|---|---|---|
| Area Measurement | `AreaMeasurementAnalysis` | Measure plot area |
| Direct Line Measurement | `DirectLineMeasurementAnalysis` | Measure distances |
| Line of Sight | `LineOfSightAnalysis` | Visibility checks |
| Viewshed | `ViewshedAnalysis` | Radar viewshed, visibility cones |
| Dimension | `DimensionAnalysis` | Building height measurements |
| Slice | `SliceAnalysis` | Cross-section analysis |

Active tool shows placement prompt with Clear/Done buttons. ESC cancels.

### RadarViewshedPanel

- Sets up `ViewshedAnalysis` on the scene
- Interactive cone editing with FOV inputs (horizontal/vertical)
- `aimAtTarget()` function for heading/tilt/farDistance calculation
- "Edit visible viewsheds" checkbox enables/disables interaction
- PDF report generation using jsPDF + screenshot

### AssessmentPanel

Checkboxes for iEP compliance checks:
- Height Analysis
- OLS Intersection
- ILS Technical Analysis
- GFA
- Radar

Results display in accordion sections:
- Shell Extraction (status, element/vertex/triangle counts)
- Height Analysis (building height, max/min elevation)
- Gross Floor Area (m²)
- Facade Materials (optional)
- Pipeline errors if any stage fails

## GIS Layers (from iEP ArcGIS Portal)

| Layer | Type | Source |
|---|---|---|
| Proposed building | Scene Layer (multipatch) | iEP Scene service |
| Surrounding buildings | Scene Layer (LOD2) | iEP ArcGIS Portal |
| OLS surfaces | Scene Layer (multipatch) | iEP ArcGIS Portal |
| ILS technical templates | Scene Layer (multipatch) | iEP ArcGIS Portal |
| Composite Height Templates | Scene Layer (multipatch) | iEP ArcGIS Portal |

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_IEP_PORTAL_URL` | iEP ArcGIS Portal URL |
| `VITE_IEP_SCENE_BUILDINGS_URL` | LOD2 buildings Scene Layer |
| `VITE_IEP_SCENE_OLS_URL` | OLS surfaces Scene Layer |
