import {OSMLayer} from '@common/component/map/layer/OSMLayer'
import {OpenLayerMap} from '@common/component/map/OpenLayerMap'
import {PublicStateStyles, vectorLayerSelectStyle} from '@common/component/map/styles'
import {Box, Stack} from '@mui/material'
import {ConceptAssignmentDetail} from '@public/models/ConceptAssignmentDetail'
import {ViewPoint} from '@vcmap/core'
import {Feature} from 'ol'
import React, {FC, useCallback, useEffect, useMemo, useState} from 'react'
import {GeoJSONLayer} from '@common/component/map/layer/GeoJSONLayer';
import {dietenbachGeoJsonUrl} from '@common/urls';
import {dietenbachWmsUrl} from '@common/urls';
import { parcelsToFeatures } from '@protected/model/Parcel'
import {WMSLayer} from '@common/component/map/layer/WMSLayer';
import {ConstructionFieldOnMapModal} from '@public/components/ConstructionFieldOnMapModal';

interface ConceptAssignment2DMapProps {
  assignments: ConceptAssignmentDetail[]
  activeAssignment?: ConceptAssignmentDetail
  onSelectAssignment?: (assignment: ConceptAssignmentDetail | null) => void
}

export const ConceptAssignment2DMap: FC<ConceptAssignment2DMapProps> = ({
  assignments,
  activeAssignment,
  onSelectAssignment,
}) => {
  const [activeFeature, setActiveFeature] = useState<Feature | null>()

  const features = useMemo(() => assignments.flatMap((i) =>
    parcelsToFeatures(i.parcels).map((feature) => {
      feature.setId(i.id)
      feature.set('fid', i.parcels[0].fid)
      feature.set('state', i.state)

      if (activeAssignment?.id === i.id) {
        feature.setStyle(vectorLayerSelectStyle.style)
      } else {
        feature.setStyle(PublicStateStyles[i.state].style)
      }
      return feature
    }),
  ),
  [JSON.stringify(assignments), JSON.stringify(activeAssignment)])

  useEffect(() => {
    if (activeAssignment) {
      const featureForAssignment = features.find((i) => i.getId() == activeAssignment.id)

      if (featureForAssignment) {
        setActiveFeature(featureForAssignment)
      }
    }
  }, [JSON.stringify(activeAssignment)])


  const selectAssignment = useCallback((feature: Feature | null) => {
    if (feature == null) {
      onSelectAssignment && onSelectAssignment(null)
      return
    }

    const newAssignment = assignments.find((i) => i.parcels[0].fid == feature.getProperties().fid)
    if (newAssignment && newAssignment.state === 'ACTIVE') {
      onSelectAssignment && onSelectAssignment(newAssignment)
    } else if (newAssignment && newAssignment.state === 'REVIEW') {
      setSelection(['assignmentInReview', newAssignment.assignmentEnd, newAssignment.name] );
    } else if (newAssignment && newAssignment.state === 'FINISHED') {
      setSelection(['assignmentFinished', newAssignment.assignmentEnd, newAssignment.name] );
    }
  }, [assignments])

  const activeFeatureGeometry = useMemo(() => activeFeature?.getGeometry(), [activeFeature])
  const [selection, setSelection] = React.useState<any | null>(null)

  return (
    <Stack direction='column' spacing={1}>
      <Box sx={{height: '500px'}}>
        <OpenLayerMap
          viewPoint={activeFeatureGeometry ?
            ViewPoint.createViewPointFromExtent(activeFeatureGeometry.getExtent()) :
            ViewPoint.createViewPointFromExtent([7.791216, 48.006793, 7.798491, 48.010080])
          }
        >
          <GeoJSONLayer
            activeOnStartup
            features={features}
            zIndex={3}
            onClick={selectAssignment}
          />
          <GeoJSONLayer
            activeOnStartup
            url={dietenbachGeoJsonUrl}
            zIndex={2}
            onClick={(a) => {
              if (a && a.getProperties()) {
                setSelection(['constructionField', a.getProperties().bauabschnitt, a.getProperties().baufeld, a.getProperties().bemerkung]);
              }
            }}
          />
          <WMSLayer
            activeOnStartup
            url={dietenbachWmsUrl}
            layers={'rahmenplan'}
            opacity={0.75}
            parameters={'TRANSPARENT=true'}
            zIndex={1}
          />
          <OSMLayer/>
        </OpenLayerMap>
      </Box>
      {selection && <ConstructionFieldOnMapModal data={selection} onClose={() => setSelection(null)}/>}
    </Stack>
  )
}

export default ConceptAssignment2DMap
