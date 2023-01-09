import useIntersectionObserver from '@common/hooks/useIntersectionObserver';
import React, { FunctionComponent, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface ScrollObserverProps {
  onEnter: () => void
  entryThreshold?: number | number[]
  debug?: boolean
}

export const ScrollObserver: FunctionComponent<ScrollObserverProps & IntersectionObserverInit> = (props) => {
  const {onEnter, debug, ...IOProps} = props
  const ref = useRef<HTMLDivElement | null>(null)

  const entry = useIntersectionObserver(ref, {
    ...IOProps,
    threshold: props.entryThreshold === undefined ? 0.75 : props.entryThreshold,
    rootMargin: props.rootMargin === undefined ? '200px 0px -250px 0px' : props.rootMargin,
  })
  const isVisible = !!entry?.isIntersecting


  useEffect(() => {
    isVisible && onEnter()
  }, [isVisible, entry?.intersectionRatio])

  return <>
    {debug && ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            width: entry?.rootBounds?.width,
            height: entry?.rootBounds?.height,
            top: entry?.rootBounds?.top,
            bottom: entry?.rootBounds?.bottom,
            right: entry?.rootBounds?.right,
            left: entry?.rootBounds?.left,
            border: '3px solid red',
            borderStyle: 'dashed',
            zIndex: 9999,
          }}
        />,
        document.body,
    )}
    <div ref={ref} data-visible={isVisible} style={{position: 'relative'}}>
      {props.children}
    </div>
  </>
}
