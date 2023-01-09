import { EventType, GeoJSONLayer as GeoJSONLayerClass, MapCollection, VectorOptions, VectorStyleItem } from '@vcmap/core'
import { Feature } from 'ol'
import {FC, useCallback, useContext, useEffect, useRef} from 'react'
import SelectInteraction from '../interaction/SelectInteraction'
import { MapContext } from '../MapContext'


interface GeoJSONLayerInteractionProps {
  onClick?: (feature: Feature | null, layer: GeoJSONLayerClass) => void
  defaultStyle?: VectorStyleItem | undefined
  features?: Feature[]
}


export const GeoJSONLayer: FC<VectorOptions & GeoJSONLayerInteractionProps> = (props) => {
  const mapContext = useContext(MapContext)
  const dummyMapCollection = useRef(new MapCollection()).current
  const layer = useRef<GeoJSONLayerClass>(
      new GeoJSONLayerClass({...props, features: undefined}),
  ).current


  const onClickCallback = useCallback((params: any) => {
    if (props.onClick) {
      if (params == null) {
        props.onClick(null, layer)
      } else if (params instanceof Feature) {
        props.onClick(params, layer)
      } else {
        console.warn('Expected instance of Feature')
      }
    }
  }, [props.onClick])

  useEffect(() => {
    const {features} = props
    if (features != undefined) {
      layer.removeAllFeatures()
      // clone feature before adding it to the map.
      // the feature gets mutated somewhere in the osm/vcs
      // code and we don't want the original feature to be
      // mutated, since that breaks whole lotta stuff.
      layer.addFeatures(features.map((f) => {
        const feature = f.clone()
        if (props.defaultStyle) {
          feature.setStyle(props.defaultStyle.style)
        }
        return feature
      }))
      layer.forceRedraw()
    } else {
      layer.removeAllFeatures()
    }
  }, [props.features])

  useEffect(() => {
    const {onClick} = props
    if (onClick) {
      const selectInteraction = new SelectInteraction(layer)
      selectInteraction.featureClicked.removeEventListener(onClickCallback)
      selectInteraction.featureClicked.addEventListener(onClickCallback)
      dummyMapCollection.add(mapContext)
      dummyMapCollection.eventHandler.featureInteraction.setActive(EventType.CLICK)
      dummyMapCollection.eventHandler.addExclusiveInteraction(selectInteraction, () => {
        selectInteraction.destroy()
      })
    }
  }, [props.onClick])

  useEffect(() => {
    layer.activate().then(() => {
      mapContext.layerCollection.add(layer);
    }).then(() => {
      if (props.defaultStyle) {
        layer.getFeatures().forEach((feature) => {
          feature.setStyle(props.defaultStyle?.style)
        })
      }
    })


    return () => layer.destroy()
  }, [])

  return null
}
