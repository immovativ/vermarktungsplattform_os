import { TerrainLayer as TerrainLayerClass, TerrainOptions} from '@vcmap/core'
import {FC, useContext, useEffect, useRef } from 'react'
import { MapContext } from '../MapContext'


export const TerrainLayer: FC<TerrainOptions> = (props) => {
  const mapContext = useContext(MapContext)

  const layer = useRef<TerrainLayerClass>(
      new TerrainLayerClass(props),
  ).current

  useEffect(() => {
    layer.activate().then(() => {
      mapContext.layerCollection.add(layer);
    })

    return () => layer.destroy()
  }, [])

  return null
}
