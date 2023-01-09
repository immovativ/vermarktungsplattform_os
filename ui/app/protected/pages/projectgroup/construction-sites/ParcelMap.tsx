import { GeoJSONLayer } from '@common/component/map/layer/GeoJSONLayer'
import { OSMLayer } from '@common/component/map/layer/OSMLayer'
import { OpenLayerMap } from '@common/component/map/OpenLayerMap'
import { vectorLayerSelectStyle } from '@common/component/map/styles'
import { GridSelectionModel } from '@mui/x-data-grid'
import { Parcel, ParcelType, ParcelTypeColors, parcelTypeTranslations } from '@protected/model/Parcel'
import { VectorStyleItem, ViewPoint } from '@vcmap/core'
import { Feature } from 'ol'
import { extend } from 'ol/extent'
import GeoJSON from 'ol/format/GeoJSON'
import { Geometry } from 'ol/geom'
import React, { FC, useMemo, useRef, useState } from 'react'
import chroma from 'chroma-js'
import { Chip, Paper, Popover, Stack, Typography } from '@mui/material'
import {dietenbachWmsUrl} from '@common/urls';
import {WMSLayer} from '@common/component/map/layer/WMSLayer';

interface ParcelMapProps {
  parcels: Parcel[]
  selectedParcelIds: GridSelectionModel
  parcelSelected?: (parcelId: string) => void
}


const ParcelMapLegend: FC = () => {
  return <Paper sx={{p: 1}}>
    <Stack direction="column" spacing={1}>
      {Object.entries(ParcelTypeColors).map(([key, value]) => {
        return <Stack key={key} direction="row" spacing={0.5}>
          <div
            style={{
              backgroundColor: value,
              border: '1px solid',
              width: '30px',
              height: '20px',
            }}
          />
          <Typography variant="body2">{parcelTypeTranslations[key as ParcelType]}</Typography>
        </Stack>
      })}
    </Stack>
  </Paper>
}

export const ParcelMapLegendSwitcher: FC = () => {
  const anchorEl = useRef<HTMLDivElement | null>(null)
  const [mapIsActive, setMapIsActive] = useState(false)
  return <>
    <Chip
      ref={anchorEl}
      label="Legende"
      variant="outlined"
      sx={{
        'bgcolor': 'rgba(240,240,240)',
        '&&:hover': {
          bgcolor: 'white',
        },
      }}
      onClick={() => setMapIsActive(!mapIsActive)} />
    <Popover
      open={mapIsActive}
      anchorEl={anchorEl.current}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      onClose={() => setMapIsActive(false)}
    >
      <ParcelMapLegend />
    </Popover>
  </>
}

export const ParcelMap = React.forwardRef<HTMLDivElement, ParcelMapProps>((props, forwardedRef) => {
  const {parcels, selectedParcelIds} = props
  const features : Feature<Geometry>[] = useMemo(
      () => parcels.map((p) => {
        const feature = new GeoJSON().readFeature(p.shape)
        if (selectedParcelIds.includes(p.parcelId)) {
          feature.setStyle(new VectorStyleItem({
            fill: {
              color: chroma(ParcelTypeColors[p.parcelType]).alpha(0.9).rgba(),
            },
            stroke: {
              color: 'rgba(0,0,0,1)',
              width: 2,
            },
          }).style)
        } else {
          feature.setStyle(new VectorStyleItem({
            fill: {
              color: chroma(ParcelTypeColors[p.parcelType]).alpha(0.4).desaturate(0.3).rgba(),
            },
            stroke: {
              color: 'rgba(0,0,0,1)',
              width: 1,
            },
          }).style)
        }
        return feature
      })
      ,
      [JSON.stringify(parcels.map((p) => p.shape)), selectedParcelIds],
  )
  const geometries = features
      .map((f) => f.getGeometry())
      .filter((g): g is Geometry => !!g)

  if (geometries.length < 1) {
    return null;
  }

  const view = useMemo(() => {
    const extent: number[] = [...geometries[0].getExtent()];
    geometries.forEach((geometry) => [...extend(extent, [...geometry.getExtent()])])
    return ViewPoint.createViewPointFromExtent(extent)
  }, [features])

  function featureSelected(f: Feature<Geometry> | null) {
    if (f !== null) {
      const parcelId = f.getProperties().parcelId
      if (parcelId) {
        props.parcelSelected?.(parcelId)
      }
    }
  }

  return (<OpenLayerMap
    ref={forwardedRef}
    viewPoint={view}
    legend={ <ParcelMapLegendSwitcher /> }
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

ParcelMap.displayName = 'ParcelMap'
