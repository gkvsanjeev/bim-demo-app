import 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'arcgis-scene': any
      'arcgis-zoom': any
      'arcgis-navigation-toggle': any
      'arcgis-compass': any
      'arcgis-building-explorer': any
      'arcgis-basemap-gallery': any
      'arcgis-layer-list': any
      'arcgis-legend': any
      'arcgis-coordinate-conversion': any
      'calcite-action-bar': any
      'calcite-action': any
      'calcite-button': any
      'calcite-icon': any
    }
  }
}
