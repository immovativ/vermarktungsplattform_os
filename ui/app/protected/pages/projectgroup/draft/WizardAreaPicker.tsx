import {GeoJSONLayer} from '@common/component/map/layer/GeoJSONLayer';
import {OSMLayer} from '@common/component/map/layer/OSMLayer';
import {OpenLayerMap} from '@common/component/map/OpenLayerMap';
import {Button, Grid, Stack} from '@mui/material';
import {Feature} from 'ol';
import {Polygon} from 'ol/geom';
import React, {FunctionComponent, useState} from 'react';
import {WizardArea} from './NewConceptAssignmentModal';
import {
  vectorLayerSelectStyle, vectorLayerDisabledStyle,
} from '@common/component/map/styles';
import {GeoJSONLayer as GeoJSONLayerClass, ViewPoint} from '@vcmap/core';
import {dietenbachWmsUrl} from '@common/urls';
import {WMSLayer} from '@common/component/map/layer/WMSLayer';

interface Props {
  onProceed: (p: WizardArea) => void
}

export const WizardAreaPicker: FunctionComponent<Props> = ({
  onProceed,
}) => {
  const [shape, setShape] = useState<Feature | undefined>()
  const viewPoint = ViewPoint.createViewPointFromExtent([7.78252619864597, 48.0019292910461, 7.80009760980762, 48.0149778350817])
  viewPoint.distance = 1800

  const onClick = (feature: Feature | null, layer: GeoJSONLayerClass) : void =>{
    if (feature == null) {
      setShape(undefined)

      layer.getFeatures().forEach((layerFeature) => {
        layerFeature.setStyle(undefined)
      })
      return
    }

    layer.getFeatures().forEach((layerFeature) => {
      if (layerFeature.getId() === feature.getId()) {
        layerFeature.setStyle(vectorLayerSelectStyle.style)
      } else {
        layerFeature.setStyle(undefined)
      }
    })

    const geom = feature.getGeometry()
    if (geom instanceof Polygon) {
      setShape(feature)
      setChoosenConstructionField(feature.get('bauabschnitt'), feature.get('baufeld'))
    }
  }

  function setChoosenConstructionField(constructionSection: string, constructionField: string) {
    const constructionFieldInfo: HTMLDivElement = (document.getElementById('constructionFieldInfo') as HTMLDivElement);
    if (constructionFieldInfo !== null) {
      constructionFieldInfo.innerHTML = 'Bauabschnitt: ' + constructionSection + ', Baufeld: ' + constructionField
    }
  }

  return <>
    <Grid container sx={{flexGrow: 1}}>
      <Grid item sx={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
        <Stack direction="column" flexGrow="1" spacing={1}>
          <OpenLayerMap viewPoint={viewPoint}>
            <GeoJSONLayer
              url={'/api/construction-area/available/feature-collection'}
              activeOnStartup
              onClick={onClick}
              zIndex={999}
            />
            <GeoJSONLayer
              url={'/api/construction-area/unavailable/feature-collection'}
              activeOnStartup
              defaultStyle={vectorLayerDisabledStyle}
              zIndex={899}
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
          <div id='constructionFieldInfo'></div>
        </Stack>
        <div>
          <Button sx={{mt: 4}} variant="contained" color="primary"
            disabled={shape == undefined}
            onClick={() => shape && onProceed(
                {
                  constructionAreaId: shape.get('bauabschnitt'),
                  constructionSiteId: shape.get('baufeld'),
                })}
          >
            Weiter
          </Button>
        </div>
      </Grid>
    </Grid>
  </>
}
