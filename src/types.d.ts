import 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'arcgis-scene': any
      'arcgis-zoom': any
      'arcgis-navigation-toggle': any
      'arcgis-compass': any
      'arcgis-building-explorer': any
    }
  }
}
