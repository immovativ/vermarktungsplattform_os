import {FC, useContext, useEffect, useRef } from 'react'
import { MapContext } from '../MapContext'
import {Overlay as OverlayClass} from 'ol'
import { Coordinate } from 'ol/coordinate'
import { OpenlayersMap } from '@vcmap/core'
import ReactDOM from 'react-dom'

interface OverlayProps {
  coords: Coordinate
}


export const Overlay: FC<OverlayProps> = (props) => {
  const overlayContainerRef = useRef<HTMLDivElement>(document.createElement('div')).current
  const overlayRef = useRef(new OverlayClass({})).current
  const mapContext = useContext(MapContext)

  useEffect(() => {
    overlayRef.setPosition(props.coords)

    return () => {
      overlayRef.dispose()
      if (mapContext instanceof OpenlayersMap) {
        mapContext.olMap.removeOverlay(overlayRef)
      }
    }
  }, [])

  useEffect(() => {
    overlayRef.setPosition(props.coords)
  }, [props.coords])

  useEffect(() => {
    if (!overlayContainerRef) {
      console.log('container not initialized. return.')
      return
    }

    if (mapContext instanceof OpenlayersMap) {
      overlayRef.setElement(overlayContainerRef)
      overlayRef.setPositioning('bottom-center')
      mapContext.olMap.addOverlay(overlayRef)
    }
  }, [overlayRef])

  return ReactDOM.createPortal(
      props.children,
      overlayContainerRef,
  )
}
