import {LoadingButton} from '@common/component/LoadingButton';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {Edit, Label, MapsHomeWork, Place} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
} from '@mui/material';
import React, {FunctionComponent, useEffect, useRef, useState} from 'react';
import {WizardData} from './NewConceptAssignmentModal';
import {
  AdminConceptAssignmentDetail,
  BuildingType,
  CreateConceptAssignmentRequest,
  createDraft,
  uploadPreviewImage,
} from '../queries/concept-assignment';
import {FeatureMap} from '@protected/components/map/FeatureMap';
import {useQuery} from 'react-query';
import axios from 'axios';
import Feature from 'ol/Feature';
import {Parcel, parcelsToFeatures} from '@protected/model/Parcel';
import {ConstructionSiteKey} from '@protected/model/ConstructionSite';

interface Props {
    data: WizardData
    afterCreate: (detail: AdminConceptAssignmentDetail) => void
    changeBasis: () => void
    changeLocation: () => void
    anliegerUsingAnchor: {constructionSite: ConstructionSiteKey} | null
}

export const WizardReview: FunctionComponent<Props> = ({
  data,
  afterCreate,
  changeBasis,
  changeLocation,
  anliegerUsingAnchor,
}) => {
  if (data.parcel == null) {
    return null
  }
  const isAnchorObject = anliegerUsingAnchor === null
  const [parcelFeatures, setParcelFeatures] = useState<Feature[] | null>(null)
  const {
    constructionAreaId,
    constructionSiteId,
    parcelIds,
  } = data.parcel

  const {data: parcels} = useQuery(['construction-site', data.area, 'parcel', parcelIds], async () => {
    const parcels: Parcel[] = (await axios.get(`/api/construction-area/${constructionAreaId}/construction-site/${constructionSiteId}/parcels`)).data

    return parcels.filter((p) => parcelIds.includes(p.parcelId))
  })

  useEffect(() => {
    if (parcels) {
      setParcelFeatures(parcelsToFeatures(parcels))
    }
  }, [parcels]);


  const mapRef = useRef<HTMLDivElement>(null)
  const mutation = useBetterMutation(
      (payload: CreateConceptAssignmentRequest) => createDraft(payload),
      {onSuccess: (r) => afterCreate(r.data)},
  )

  const payload: CreateConceptAssignmentRequest = {
    name: data.basis?.name as string,
    parcelRefs: data.parcel.parcelIds.map((parcelId) => ({
      constructionAreaId,
      constructionSiteId,
      parcelId,
    })),
    buildingType: data.basis?.buildingType as BuildingType,
    conceptAssignmentType: isAnchorObject ? 'ANCHOR' : 'ANLIEGER',
  }

  async function takeSnapshotFromMap(source: NodeListOf<HTMLCanvasElement>): Promise<Blob> {
    let sourceCanvas: HTMLCanvasElement;

    if (source.length > 1) {
      const newCanvas = document.createElement('canvas')
      const context = newCanvas.getContext('2d')
      const canvasOne = source.item(0)

      const width = canvasOne.width
      const height = canvasOne.height

      newCanvas.width = width
      newCanvas.height = height

      source.forEach((canvas) => {
        context?.beginPath()
        context?.drawImage(canvas, 0, 0, width, height)
      })

      sourceCanvas = newCanvas
    } else {
      sourceCanvas = source.item(0)
    }

    return await new Promise<Blob>((resolve, reject) => sourceCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed creating Blob'))
      } else {
        resolve(blob)
      }
    }, 'image/jpg', 0.85))
  }

  const submit = async () => {
    const canvas = mapRef.current?.querySelectorAll<HTMLCanvasElement>('.ol-layer canvas')

    if (!canvas) {
      return
    }

    const image = await takeSnapshotFromMap(canvas)

    await mutation.mutateAsync(payload)
        .then((value) => value.data.id)
        .then((id) => uploadPreviewImage(id, image))
  }


  return <>
    <Grid container>
      <Grid item sx={{width: '100%'}}>
        <List dense={false}>
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <MapsHomeWork />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={anliegerUsingAnchor === null ? 'Ankerprojekt' : `Anliegerprojekt`}
            />
          </ListItem>
          <ListItem secondaryAction={
            <Tooltip title='Basisdaten ändern'>
              <IconButton edge="end" aria-label="edit" onClick={changeBasis}>
                <Edit />
              </IconButton>
            </Tooltip>
          }>
            <ListItemAvatar>
              <Avatar>
                <Label />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={data.basis?.name}
            />
          </ListItem>
          <ListItem secondaryAction={
            <Tooltip title='Flächenbezug ändern'>
              <IconButton edge="end" aria-label="edit" onClick={changeLocation}>
                <Edit />
              </IconButton>
            </Tooltip>
          } >
            <ListItemAvatar>
              <Avatar>
                <Place />
              </Avatar>
            </ListItemAvatar>
            <Box sx={{flexGrow: '1'}}>
              <Box sx={{width: '350px', height: '350px'}}>
                {parcelFeatures && <FeatureMap
                  ref={mapRef}
                  features={parcelFeatures}
                />}
              </Box>
            </Box>
          </ListItem>
        </List>
      </Grid>
    </Grid>

    {mutation.isError && <Alert severity='error'>{mutation.error.message}</Alert>}
    <Grid container>
      <Grid item>
        <LoadingButton loading={mutation.isLoading} sx={{mt: 4}} variant='contained' color='primary'
          onClick={submit}>Vergabeverfahren-Entwurf anlegen</LoadingButton>
      </Grid>
    </Grid>

  </>
}
