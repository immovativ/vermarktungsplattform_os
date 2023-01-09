
import {WMSLayer as WMSLayerClass, WMSOptions} from '@vcmap/core'
import {FC, useContext, useEffect, useRef } from 'react'
import { MapContext } from '../MapContext'


export const WMSLayer: FC<WMSOptions> = (props) => {
  const mapContext = useContext(MapContext)

  const layer = useRef<WMSLayerClass>(
      new WMSLayerClass({...props}),
  ).current

  useEffect(() => {
    layer.activate().then(() => {
      mapContext.layerCollection.add(layer);
    })

    return () => layer.destroy()
  }, [])

  return null
}
