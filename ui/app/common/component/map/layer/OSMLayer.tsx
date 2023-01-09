
import { OpenStreetMapLayer } from '@vcmap/core'
import {FC, useContext, useEffect, useRef } from 'react'
import { MapContext } from '../MapContext'


export const OSMLayer: FC = () => {
  const mapContext = useContext(MapContext)

  const layer = useRef(
      new OpenStreetMapLayer({
        name: 'osmBase',
      }),
  ).current

  useEffect(() => {
    layer.activate().then(() => {
      mapContext.layerCollection.add(layer);
    })

    return () => layer.destroy()
  }, [])

  return null
}
