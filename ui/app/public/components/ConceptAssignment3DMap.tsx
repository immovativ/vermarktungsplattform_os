import { CesiumMap } from '@common/component/map/CesiumMap'
import { CesiumTilesetLayer } from '@common/component/map/layer/CesiumTilesetLayer'
import { GeoJSONLayer } from '@common/component/map/layer/GeoJSONLayer'
import { OSMLayer } from '@common/component/map/layer/OSMLayer'
import { TerrainLayer } from '@common/component/map/layer/TerrainLayer'
import {PublicStateStyles, vectorLayerSelectStyle} from '@common/component/map/styles'
import {Box, Stack} from '@mui/material'
import { ConceptAssignmentDetail } from '@public/models/ConceptAssignmentDetail'
import { ViewPoint } from '@vcmap/core'
import { Feature } from 'ol'
import GeoJSON from 'ol/format/GeoJSON'
import React, {FC, useCallback, useEffect, useMemo, useState} from 'react'
import {dietenbachGeoJsonUrl, dietenbachWmsUrl} from '@common/urls';
import {WMSLayer} from '@common/component/map/layer/WMSLayer';
import {ConstructionFieldOnMapModal} from '@public/components/ConstructionFieldOnMapModal';

interface ConceptAssignment2DMapProps {
  assignments: ConceptAssignmentDetail[]
  activeAssignment?: ConceptAssignmentDetail
  onSelectAssignment?: (assignment: ConceptAssignmentDetail | null) => void
}

export const ConceptAssignment3DMap: FC<ConceptAssignment2DMapProps> = ({assignments, activeAssignment, onSelectAssignment}) => {
  const [activeFeature, setActiveFeature] = useState<Feature | null>()

  const features = useMemo(() => assignments.flatMap((i) =>
    i.parcels.map((p) => {
      const feature = new GeoJSON().readFeature(p.shape)

      feature.setId(i.id)
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
      <Box>
        <CesiumMap
          viewPoint={
            activeFeatureGeometry ?
              ViewPoint.createViewPointFromExtent(activeFeatureGeometry.getExtent()) :
              ViewPoint.createViewPointFromExtent([7.790216, 48.005793, 7.799491, 48.013080])
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
          <TerrainLayer
            url='https://3d.freiburg.de/datasource-data/8b856231-793c-4eb9-8fe4-c01177da366b'
          />
          <CesiumTilesetLayer
            url="tilesets/tileset.json"
            name='Texturierte Gebaeude 2020'
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
        </CesiumMap>
      </Box>
      {selection && <ConstructionFieldOnMapModal data={selection} onClose={() => setSelection(null)}/>}
    </Stack>
  )
}

export default ConceptAssignment3DMap
