import { GeoJSONLayer } from '@common/component/map/layer/GeoJSONLayer'
import { OSMLayer } from '@common/component/map/layer/OSMLayer'
import { OpenLayerMap } from '@common/component/map/OpenLayerMap'
import { vectorLayerSelectStyle } from '@common/component/map/styles'
import { ViewPoint } from '@vcmap/core'
import { Feature } from 'ol'
import { extend } from 'ol/extent'
import { Geometry } from 'ol/geom'
import React, { useMemo } from 'react'
import {dietenbachWmsUrl} from '@common/urls'
import {WMSLayer} from '@common/component/map/layer/WMSLayer';

type FeatureMapProps = ({
  feature: Feature
  features?: undefined
} | {
  feature?: undefined
  features: Feature[]
})

export const FeatureMap = React.forwardRef<HTMLDivElement, FeatureMapProps>((props, forwardedRef) => {
  const features = props.features || [props.feature]
  const geometries = features
      .map((f) => f.getGeometry())
      .filter((g): g is Geometry => !!g)

  if (geometries.length < 1) {
    return null;
  }

  const view = useMemo(() => {
    const extent: number[] = [...geometries[0].getExtent()];
    geometries.forEach((geometry) => extend(extent, [...geometry.getExtent()]))
    return ViewPoint.createViewPointFromExtent(extent)
  }, [features])

  return (<OpenLayerMap
    ref={forwardedRef}
    disableInteraction
    viewPoint={view}
  >
    <GeoJSONLayer
      features={features}
      zIndex={9}
      style={vectorLayerSelectStyle}
    />
    <WMSLayer
      activeOnStartup
      url={dietenbachWmsUrl}
      layers={'rahmenplan'}
      opacity={0.75}
      parameters={'TRANSPARENT=true'}
      zIndex={1}
    />
    <OSMLayer />
  </OpenLayerMap>)
})

FeatureMap.displayName = 'FeatureMap'
