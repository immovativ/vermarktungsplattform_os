import { Close } from '@mui/icons-material';
import {
  Dialog, DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
} from '@mui/material';
import { ConstructionSiteKey } from '@protected/model/ConstructionSite';
import React, { FunctionComponent } from 'react';
import { AdminConceptAssignmentDetail, BuildingType } from '../queries/concept-assignment';
import { WizardAreaPicker } from './WizardAreaPicker';
import { WizardBasisDataPicker } from './WizardBasisDataPicker';
import { WizardParcelPicker } from './WizardParcelPicker';
import { WizardReview } from './WizardReview';
interface Props {
  onClose: () => void
  onSuccess: (detail: AdminConceptAssignmentDetail) => void
  anliegerUsingAnchor: {constructionSite: ConstructionSiteKey} | null
}

type WizardStep = 'basis' | 'area' | 'parcel' | 'review'

export interface WizardBasisData {
    name: string
    buildingType: BuildingType
}
export interface WizardArea {
  constructionAreaId: string
  constructionSiteId: string
}

export interface WizardParcelRef {
  constructionAreaId: string
  constructionSiteId: string
  parcelIds: string[]
}

export interface WizardData {
  forceStep: WizardStep | null
  basis: WizardBasisData | null
  area: WizardArea | null
  parcel: WizardParcelRef | null
}

const nextStep: (d: WizardData, isAnchorObject: boolean) => WizardStep = (d, isAnchorObject) => {
  if (d.forceStep !== null) {
    return d.forceStep
  }
  if (d.basis === null) {
    return 'basis'
  }
  if (d.area === null && d.basis !== null && isAnchorObject) {
    return 'area'
  }
  if ((d.area !== null && d.basis !== null) || !isAnchorObject) {
    return 'parcel'
  }

  return 'review'
}

const activeStep: (s: WizardStep, isAnchorObject: boolean) => number = (s, isAnchorObject) => {
  if (isAnchorObject) {
    switch (s) {
      case 'basis': return 0
      case 'area': return 1
      case 'parcel': return 2
      case 'review': return 3
    }
  } else {
    switch (s) {
      case 'basis': return 0
      case 'area': return 1
      case 'parcel': return 1
      case 'review': return 2
    }
  }
}

export const NewConceptAssignmentModal: FunctionComponent<Props> = ({
  onClose,
  onSuccess,
  anliegerUsingAnchor,
}) => {
  const isAnchorObject = anliegerUsingAnchor === null

  const [data, setData] = React.useState<WizardData>({
    basis: null,
    forceStep: null,
    area: !isAnchorObject ? {
      ...anliegerUsingAnchor.constructionSite,
    } : null,
    parcel: null,
  })

  const currentStep = nextStep(data, isAnchorObject)

  const name = `Neues Vergabeverfahren für ${isAnchorObject ? 'Ankerprojekt' : 'Anliegerprojekt'}`

  return <Dialog
    open={true}
    fullWidth
    maxWidth="lg"
    aria-label={name}
  >
    <DialogTitle style={{textAlign: 'center'}}>
      {data?.basis?.name || name}
      <Tooltip title="Verwerfen">
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
      </Tooltip>
    </DialogTitle>
    <DialogContent style={{height: '80vh', display: 'flex', flexDirection: 'column'}}>
      <Stepper sx={{pb: 3}} activeStep={activeStep(currentStep, isAnchorObject)} alternativeLabel>
        <Step>
          <StepLabel>Basisdaten</StepLabel>
        </Step>
        {isAnchorObject && <Step>
          <StepLabel>Bauflächenbezug</StepLabel>
        </Step>}
        <Step>
          <StepLabel>Parzellenbezug</StepLabel>
        </Step>
        <Step>
          <StepLabel>Vorschau</StepLabel>
        </Step>
      </Stepper>
      <Stack direction="column" spacing={1} flexGrow="1">
        {currentStep === 'basis' && <WizardBasisDataPicker
          prevData={data.basis}
          onProceed={(b) => setData({...data,
            forceStep: null, basis: b })}
          anliegerUsingAnchor={anliegerUsingAnchor}
        />}
        {currentStep === 'area' && <WizardAreaPicker
          onProceed={(a) => setData({
            ...data,
            forceStep: null,
            area: a },
          )}/>}
        {currentStep === 'parcel' && data.area &&
          <WizardParcelPicker allowMultiSelect={anliegerUsingAnchor === null} data={data.area} onProceed={(a) => setData({...data,
            forceStep: 'review', parcel: a })} />
        }
        {currentStep === 'review' && <WizardReview data={data} afterCreate={onSuccess}
          changeBasis={() => setData({...data, forceStep: 'basis'})}
          changeLocation={() => setData({...data, forceStep: 'area'})}
          anliegerUsingAnchor={anliegerUsingAnchor}
        />}
      </Stack>
    </DialogContent>
  </Dialog>
}
