import {
  Alert,
  AlertTitle,
  Button, FormControlLabel, FormGroup, Radio, RadioGroup, TextField, Typography,
} from '@mui/material';
import { ConstructionSiteKey } from '@protected/model/ConstructionSite';
import { useFormik } from 'formik';
import React, { FunctionComponent } from 'react';
import * as Yup from 'yup';
import { BuildingType, BuildingTypeTranslations } from '../queries/concept-assignment';
import { WizardBasisData } from './NewConceptAssignmentModal';


interface Props {
    onProceed: (data: WizardBasisData) => void
    prevData: WizardBasisData | null
    anliegerUsingAnchor: {constructionSite: ConstructionSiteKey} | null
}

const Schema = Yup.object().shape({
  name: Yup.string()
      .required('Bitte geben sie einen Namen an.')
      .min(1)
      .trim(),
})

export const WizardBasisDataPicker: FunctionComponent<Props> = ({
  onProceed,
  prevData,
  anliegerUsingAnchor,
}) => {
  const [buildingType, setBuildingType] = React.useState<BuildingType>(prevData?.buildingType || 'MGW')
  const formik = useFormik<{name: string}>({
    initialValues: {
      name: prevData?.name || '',
    },
    validationSchema: Schema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: (values) => {
      onProceed({name: values.name, buildingType: buildingType})
    },
  })

  return <>
    {anliegerUsingAnchor === null ? <Alert sx={{mb: 1}} variant='outlined' severity="info">
      <AlertTitle>Ankerprojekt wird angelegt</AlertTitle>
      Es wird eine Konzeptvergabe für ein Ankerprojekt angelegt. Um eine Konzeptvergabe für ein Anliegerprojekt anzulegen
      öffnen Sie die Konzeptvergabe für das entsprechende Ankerprojekt und erstellen Sie die neue Konzeptvergabe von dort aus.
    </Alert> : <Alert sx={{mb: 1}} variant='outlined' severity="info">
      <AlertTitle>Anliegerprojekt wird angelegt</AlertTitle>
      Es wird eine Konzeptvergabe für ein Anliegerprojekt angelegt.
    </Alert>
    }
    <Typography sx={{pb: 2}} variant='body1'>Bitte geben Sie einen Namen für das Verfahren an.</Typography>
    <form onSubmit={formik.handleSubmit}>
      <FormGroup>
        <TextField margin="dense" label="Name"
          name="name"
          placeholder="Eine Testvergabe"
          value={formik.values.name}
          onChange={formik.handleChange}
          error={!!formik.errors.name}
          helperText={formik.errors.name ? formik.errors.name : null}
        />

        <Typography sx={{pt: 2, pb: 2}} variant='body1'>Bitte wählen Sie die ausgeschriebene Gebäudetypologie.</Typography>
        <RadioGroup
          row
          value={buildingType}
          onChange={(e) => setBuildingType(e.target.value as BuildingType)}
        >
          {Object.keys(BuildingTypeTranslations).map((key, idx) => <FormControlLabel
            key={`building-type-${idx}`}
            value={key} control={<Radio />} label={BuildingTypeTranslations[key as BuildingType]} />,
          ) }
        </RadioGroup>
      </FormGroup>
      <Button sx={{mt: 4}} variant='contained' type="submit" color='primary'>Weiter</Button>
    </form>
  </>
}
