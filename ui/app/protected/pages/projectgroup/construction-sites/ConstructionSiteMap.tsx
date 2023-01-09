import { GeoJSONLayer } from '@common/component/map/layer/GeoJSONLayer'
import { OSMLayer } from '@common/component/map/layer/OSMLayer'
import { OpenLayerMap } from '@common/component/map/OpenLayerMap'
import { vectorLayerSelectStyle } from '@common/component/map/styles'
import { GridSelectionModel } from '@mui/x-data-grid'
import { ConstructionSite } from '@protected/model/ConstructionSite'
import { VectorStyleItem, ViewPoint } from '@vcmap/core'
import { Feature } from 'ol'
import { extend } from 'ol/extent'
import GeoJSON from 'ol/format/GeoJSON'
import { Geometry } from 'ol/geom'
import React, { useMemo } from 'react'
import {dietenbachWmsUrl} from '@common/urls';
import {WMSLayer} from '@common/component/map/layer/WMSLayer';

interface Props {
  constructionSites: ConstructionSite[]
  selectedConstructionSiteFids: GridSelectionModel
  constructionSiteSelected?: (fid: string) => void
}

const constructionSiteStyle = new VectorStyleItem({
  stroke: {
    color: 'rgba(205, 10, 10, 0.2)',
    width: 2,
  },
  fill: {
    color: 'rgba(240, 100, 100, 0.3)',
  },
  text: {},
})

const constructionSiteSelectedStyle = new VectorStyleItem({
  stroke: {
    color: 'rgba(205, 10, 10, 0.4)',
    width: 2,
  },
  fill: {
    color: 'rgba(240, 100, 100, 0.5)',
  },
  text: {},
})

export const ConstructionSiteMap = React.forwardRef<HTMLDivElement, Props>((props, forwardedRef) => {
  const {constructionSites, selectedConstructionSiteFids} = props
  const features : Feature<Geometry>[] = useMemo(
      () => constructionSites.map((cs) => {
        const feature = new GeoJSON().readFeature(cs.shape)
        if (selectedConstructionSiteFids.some((g) => g === cs.fid)) {
          feature.setStyle(constructionSiteSelectedStyle.style)
        } else {
          feature.setStyle(constructionSiteStyle.style)
        }
        return feature
      })
      ,
      [JSON.stringify(constructionSites.map((p) => p.shape)), selectedConstructionSiteFids],
  )
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

  function featureSelected(f: Feature<Geometry> | null) {
    if (f !== null) {
      const fid = f.getProperties().fid
      if (fid) {
        props.constructionSiteSelected?.((fid as number).toString())
      }
    }
  }

  return (<OpenLayerMap
    ref={forwardedRef}
    viewPoint={view}
  >
    <GeoJSONLayer
      features={features}
      zIndex={9}
      style={vectorLayerSelectStyle}
      onClick={featureSelected}
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

ConstructionSiteMap.displayName = 'ConstuctionSiteMap'
