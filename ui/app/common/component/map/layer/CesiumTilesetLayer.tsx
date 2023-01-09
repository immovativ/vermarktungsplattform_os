
import { CesiumTilesetLayer as CesiumTilesetLayerClass, CesiumTilesetOptions} from '@vcmap/core'
import {FC, useContext, useEffect, useRef } from 'react'
import { MapContext } from '../MapContext'


export const CesiumTilesetLayer: FC<CesiumTilesetOptions> = (props) => {
  const mapContext = useContext(MapContext)

  const layer = useRef(
      new CesiumTilesetLayerClass(props),
  ).current

  useEffect(() => {
    layer.activate().then(() => {
      mapContext.layerCollection.add(layer);
    })

    return () => layer.destroy()
  }, [])

  return null
}
