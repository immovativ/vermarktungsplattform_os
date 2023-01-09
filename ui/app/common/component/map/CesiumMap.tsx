import React, {FC, useEffect, useRef} from 'react';
import {
  CesiumMap as CesiumMapClass,
  CesiumMapOptions,
  ViewPoint,
} from '@vcmap/core';
import { MapContext } from './MapContext';
import styled from '@emotion/styled';


const CesiumMapWrapper = styled.div(() => [{
  'height': '100%',
  'width': '100%',
  '& .cesium-widget, & .cesium-widget canvas': {
    width: '100%',
    height: '100%',
  },
}])

interface ExtendedCesiumProps {
  viewPoint?: ViewPoint
}

export const CesiumMap: FC<CesiumMapOptions & ExtendedCesiumProps> = (props) => {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const map = useRef(new CesiumMapClass({
    target: mapRef.current || undefined,
  })).current

  useEffect(() => {
    if (props.viewPoint && map.active) {
      const viewPoint = props.viewPoint
      viewPoint.animate = false

      map.gotoViewPoint(viewPoint)
    }
  }, [JSON.stringify(props.viewPoint)])

  useEffect(() => {
    map.setTarget(mapRef.current)
    map.activate().then(() => {
      const viewPoint = props.viewPoint || ViewPoint.createViewPointFromExtent([7.78252619864597, 48.0019292910461, 7.80009760980762, 48.0149778350817])
      viewPoint.animate = false

      map.gotoViewPoint(viewPoint)
    })
  }, [])

  return <MapContext.Provider value={map}>
    <CesiumMapWrapper ref={mapRef}>
      {props.children}
    </CesiumMapWrapper>
  </MapContext.Provider>
}
