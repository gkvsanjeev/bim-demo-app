import '@arcgis/map-components/components/arcgis-coordinate-conversion'
import { useEffect, useRef } from 'react'

/*
 * Live coordinate readout slotted into the bottom-left of <arcgis-scene>.
 *
 * Registers a custom WGS84 "XYZ" format (longitude, latitude, elevation)
 * on top of the widget's built-in formats, mirroring the reference snippet:
 *   https://developers.arcgis.com/javascript/latest/sample-code/widgets-coordinateconversion-customformats/
 *
 * NOTE: Returns the web component directly so that it remains a *direct*
 * DOM child of <arcgis-scene>. The slot="bottom-left" attribute only takes
 * effect when slotted into the scene element — no wrapping <div>.
 */
export function CoordinateConversionTool() {
  const widgetRef = useRef<any>(null) // FIXME(arcgis): arcgis-coordinate-conversion element type not exported

  useEffect(() => {
    const widget = widgetRef.current
    if (!widget) return

    let cancelled = false

    const setup = async () => {
      const [
        { default: Conversion },
        { default: Format },
        { default: Point },
        webMercatorUtils,
      ] = await Promise.all([
        import('@arcgis/core/widgets/CoordinateConversion/support/Conversion.js'),
        import('@arcgis/core/widgets/CoordinateConversion/support/Format.js'),
        import('@arcgis/core/geometry/Point.js'),
        import('@arcgis/core/geometry/support/webMercatorUtils.js'),
      ])

      await widget.componentOnReady()
      if (cancelled) return

      const numberSearchPattern = /-?\d+[.]?\d*/

      const xyzFormat = new Format({
        name: 'XYZ',
        conversionInfo: {
          // Point → "lon, lat, z" string (auto-projects from Web Mercator)
          convert: (point: any) => {
            const p = point.spatialReference.isWGS84
              ? point
              : webMercatorUtils.webMercatorToGeographic(point)
            const x = p.x.toFixed(4)
            const y = p.y.toFixed(4)
            const z = (p.z ?? 0).toFixed(4)
            return { location: p, coordinate: `${x}, ${y}, ${z}` }
          },
          // String "lon, lat, z" → Point (for the widget's reverse search)
          reverseConvert: (s: string) => {
            const parts = s.split(',')
            return new Point({
              x: parseFloat(parts[0]),
              y: parseFloat(parts[1]),
              z: parseFloat(parts[2]),
              spatialReference: { wkid: 4326 },
            })
          },
        },
        coordinateSegments: [
          { alias: 'X', description: 'Longitude', searchPattern: numberSearchPattern },
          { alias: 'Y', description: 'Latitude', searchPattern: numberSearchPattern },
          { alias: 'Z', description: 'Elevation', searchPattern: numberSearchPattern },
        ],
        defaultPattern: 'X°, Y°, Z',
      })

      widget.formats.add(xyzFormat)
      // Pin XYZ to the top of the conversion list so it's the default readout
      widget.conversions.splice(0, 0, new Conversion({ format: xyzFormat }))
    }

    setup().catch(console.error)

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <arcgis-coordinate-conversion
      ref={widgetRef}
      slot="bottom-left"
      mode="live"
      expanded
    />
  )
}
