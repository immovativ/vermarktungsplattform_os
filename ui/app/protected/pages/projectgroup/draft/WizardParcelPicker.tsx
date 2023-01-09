import {GeoJSONLayer} from '@common/component/map/layer/GeoJSONLayer';
import {OSMLayer} from '@common/component/map/layer/OSMLayer';
import {OpenLayerMap} from '@common/component/map/OpenLayerMap';
import {Button, Grid, Stack} from '@mui/material';
import {Feature} from 'ol';
import React, {FunctionComponent, useEffect, useState} from 'react';
import {WizardArea, WizardParcelRef} from './NewConceptAssignmentModal';
import GeoJSON from 'ol/format/GeoJSON'

import { VectorStyleItem, ViewPoint} from '@vcmap/core';
import {useQuery} from 'react-query';
import axios from 'axios';
import { Parcel, ParcelTypeColors } from '@protected/model/Parcel';
import chroma from 'chroma-js';
import { ParcelMapLegendSwitcher } from '../construction-sites/ParcelMap';
import { vectorLayerDisabledStyle } from '@common/component/map/styles';
import {dietenbachWmsUrl} from '@common/urls';
import {WMSLayer} from '@common/component/map/layer/WMSLayer';

interface Props {
  data: WizardArea
  onProceed: (p: WizardParcelRef) => void
  allowMultiSelect: boolean,
}

interface ConstructionSite {
  constructionAreaId: string
  constructionSiteId: string
  shape: any
}

export const WizardParcelPicker: FunctionComponent<Props> = ({
  onProceed, data, allowMultiSelect,
}) => {
  const [features, setFeatures] = useState<Feature[]>([])
  const [disabledFeatures, setDisabledFeatures] = useState<Feature[]>([])
  const [constructionSite, setConstructionSite] = useState<Feature | null>(null)

  useQuery(['construction-sites', data], async () => {
    const cs = await axios.get<ConstructionSite>(`/api/construction-area/${data.constructionAreaId}/construction-site/${data.constructionSiteId}`)
    setConstructionSite(new GeoJSON().readFeature(cs.data.shape))
  });

  const { data: parcels } = useQuery(['construction-sites', data, 'available-parcels'], async () => {
    return (await axios.get<Parcel[]>(`/api/construction-area/${data.constructionAreaId}/construction-site/${data.constructionSiteId}/parcels/available`)).data
  });

  const { data: unavailableParcels } = useQuery(['construction-sites', data, 'unavailable-parcels'], async () => {
    return (await axios.get<Parcel[]>(
        `/api/construction-area/${data.constructionAreaId}/construction-site/${data.constructionSiteId}/parcels/unavailable`,
    )).data
  });

  const [selectedParcelIds, setSelectedParcelIds] = useState<string[]>([])

  useEffect(() => {
    if (unavailableParcels) {
      const features = unavailableParcels.map((p) => {
        const feature = new GeoJSON().readFeature(p.shape)
        feature.setStyle(vectorLayerDisabledStyle.style)
        return feature
      })

      setDisabledFeatures(features)
    }
  }, [unavailableParcels])

  useEffect(() => {
    if (parcels) {
      const features = parcels.map((p) => {
        const feature = new GeoJSON().readFeature(p.shape);

        if (selectedParcelIds.includes(p.parcelId)) {
          feature.setStyle(new VectorStyleItem({
            fill: {
              color: chroma(ParcelTypeColors[p.parcelType]).alpha(0.9).rgba(),
            },
            stroke: {
              color: 'rgba(0,0,0,1)',
              width: 2,
            },
          }).style)
        } else {
          feature.setStyle(new VectorStyleItem({
            fill: {
              color: chroma(ParcelTypeColors[p.parcelType]).alpha(0.4).desaturate(0.3).rgba(),
            },
            stroke: {
              color: 'rgba(0,0,0,1)',
              width: 1,
            },
          }).style)
        }

        return feature;
      })
      setFeatures(features)
    }
  }, [parcels, selectedParcelIds])


  const maybeConstructionExtent = constructionSite?.getGeometry()?.getExtent()
  const viewPoint = maybeConstructionExtent ?
    ViewPoint.createViewPointFromExtent(maybeConstructionExtent) :
    undefined

  const onClick = (feature: Feature | null) : void =>{
    if (feature !== null) {
      const parcelId = feature.getProperties().parcelId
      if (parcelId !== undefined) {
        if (selectedParcelIds.includes(parcelId)) {
          setSelectedParcelIds((current) => current.filter((id) => id !== parcelId))
        } else {
          if (allowMultiSelect) {
            setSelectedParcelIds((current) => [...current, parcelId])
          } else {
            setSelectedParcelIds([parcelId])
          }
        }
      }
    }
  }

  function submit() {
    if (selectedParcelIds.length > 0) {
      const ref: WizardParcelRef = {
        constructionAreaId: data.constructionAreaId,
        constructionSiteId: data.constructionSiteId,
        parcelIds: selectedParcelIds,
      }

      onProceed(ref)
    }
  }

  return <>
    <Grid container sx={{flexGrow: 1}}>
      <Grid item sx={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
        <Stack direction="column" flexGrow="1" spacing={1}>
          <OpenLayerMap
            viewPoint={viewPoint}
            legend={
              <ParcelMapLegendSwitcher />
            }
          >
            <GeoJSONLayer
              features={features}
              activeOnStartup
              onClick={onClick}
              zIndex={999}
            />
            <GeoJSONLayer
              features={disabledFeatures}
              activeOnStartup
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
        </Stack>
        <div>
          <Button sx={{mt: 4}} variant="contained" color="primary"
            disabled={selectedParcelIds.length < 1}
            onClick={submit}
          >
            Weiter
          </Button>
        </div>
      </Grid>
    </Grid>
  </>
}
