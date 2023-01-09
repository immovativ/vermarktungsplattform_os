import React, { useEffect, useMemo, useRef} from 'react';
import {
  OpenlayersMap, OpenlayersOptions, ViewPoint,
} from '@vcmap/core';
import { MapContext } from './MapContext';
import styled from '@emotion/styled';


const OLMapWrapper = styled.div(() => [{
  'height': '100%',
  'position': 'relative',
  '> .mapElement': {
    width: '100%',
    height: '100%',
  },
}])


interface ExtendedOpenLayerProps {
  disableInteraction?: boolean
  viewPoint?: ViewPoint
  children?: React.ReactNode
  legend?: React.ReactNode
}

const fallbackViewPoint = ViewPoint.createViewPointFromExtent([7.78252619864597, 48.0019292910461, 7.80009760980762, 48.0149778350817])

export const OpenLayerMap = React.forwardRef<HTMLDivElement, OpenlayersOptions & ExtendedOpenLayerProps>((props, forwardedRef) => {
  const mapRef = useRef<HTMLDivElement | null>(null)


  const map = useMemo(() => new OpenlayersMap({
    target: mapRef.current || undefined,
  }), [])


  useEffect(() => {
    if (props.viewPoint && map.active) {
      map.gotoViewPoint(props.viewPoint)
    }
  }, [JSON.stringify(props.viewPoint)])

  useEffect(() => {
    if (!forwardedRef) {
      return
    }

    if (typeof forwardedRef != 'function') {
      forwardedRef.current = mapRef.current
    } else {
      forwardedRef(mapRef.current)
    }
  }, [mapRef.current, forwardedRef])


  useEffect(() => {
    map.setTarget(mapRef.current)
    map.activate().then(() => {
      map.gotoViewPoint(props.viewPoint ? props.viewPoint : fallbackViewPoint)

      if (props.disableInteraction != undefined) {
        map.disableMovement(props.disableInteraction)
      }
    })
  }, [])

  return <MapContext.Provider value={map}>
    <OLMapWrapper ref={mapRef}>
      {props.legend && <div style={{position: 'absolute', bottom: '10px', right: '10px', zIndex: 999}}>
        {props.legend}
      </div>}
      {props.children}
    </OLMapWrapper>
  </MapContext.Provider>
})

OpenLayerMap.displayName = 'OpenLayerMap'
