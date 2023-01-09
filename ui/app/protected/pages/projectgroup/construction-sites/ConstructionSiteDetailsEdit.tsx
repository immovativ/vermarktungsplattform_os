import { LoadingButton } from '@common/component/LoadingButton'
import { Grid, Stack, TextField } from '@mui/material'
import { ConstructionSiteDetails, ConstructionSiteDetailsKeysTranslation } from '@protected/model/ConstructionSite'
import { useFormik } from 'formik'
import React, { FC } from 'react'
import * as Yup from 'yup'

interface ConstructionSiteDetailsEditProps {
  details: ConstructionSiteDetails
  isLoading: boolean
  onDetailsUpdate: (c: ConstructionSiteDetails) => void
}

const ConstructionSiteDetailsSchema = Yup.object().shape({
  form: Yup.string(),
  zoningClassification: Yup.string(),
  levelOfBuiltDevelopment: Yup.string(),
  marketSegments: Yup.string(),
  energySupply: Yup.string(),
  mobility: Yup.string(),
  clearance: Yup.string(),
  areaBuildingBlock: Yup.string(),
  plotAreaToBeBuiltOn: Yup.string(),
  landPricePerSqm: Yup.string(),
})

export const ConstructionSiteDetailsEdit: FC<ConstructionSiteDetailsEditProps> = (props) => {
  const formik = useFormik<ConstructionSiteDetails>({
    initialValues: props.details,
    enableReinitialize: true,
    validationSchema: ConstructionSiteDetailsSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      props.onDetailsUpdate(values)
    },
  })

  return <Grid
    display="grid"
    gridTemplateColumns="1fr 1fr"
    gap={2}
    component="form"
    onSubmit={formik.handleSubmit}
  >
    <TextField
      label={ConstructionSiteDetailsKeysTranslation.form}
      name="form"
      multiline
      value={formik.values.form}
      onChange={formik.handleChange}
      InputLabelProps={{
        shrink: true,
      }}
    />
    <TextField
      label={ConstructionSiteDetailsKeysTranslation.zoningClassification}
      name="zoningClassification"
      multiline
      value={formik.values.zoningClassification}
      onChange={formik.handleChange}
      InputLabelProps={{
        shrink: true,
      }}
    />
    <TextField
      label={ConstructionSiteDetailsKeysTranslation.levelOfBuiltDevelopment}
      name="levelOfBuiltDevelopment"
      multiline
      value={formik.values.levelOfBuiltDevelopment}
      onChange={formik.handleChange}
      InputLabelProps={{
        shrink: true,
      }}
    />
    <TextField
      label={ConstructionSiteDetailsKeysTranslation.marketSegments}
      name="marketSegments"
      multiline
      value={formik.values.marketSegments}
      onChange={formik.handleChange}
      InputLabelProps={{
        shrink: true,
      }}
    />
    <TextField
      label={ConstructionSiteDetailsKeysTranslation.energySupply}
      name="energySupply"
      multiline
      value={formik.values.energySupply}
      onChange={formik.handleChange}
      InputLabelProps={{
        shrink: true,
      }}
    />
    <TextField
      label={ConstructionSiteDetailsKeysTranslation.mobility}
      name="mobility"
      multiline
      value={formik.values.mobility}
      onChange={formik.handleChange}
      InputLabelProps={{
        shrink: true,
      }}
    />
    <TextField
      label={ConstructionSiteDetailsKeysTranslation.clearance}
      name="clearance"
      multiline
      value={formik.values.clearance}
      onChange={formik.handleChange}
      InputLabelProps={{
        shrink: true,
      }}
    />
    <TextField
      label={ConstructionSiteDetailsKeysTranslation.areaBuildingBlock}
      name="areaBuildingBlock"
      multiline
      value={formik.values.areaBuildingBlock}
      onChange={formik.handleChange}
      InputLabelProps={{
        shrink: true,
      }}
    />
    <TextField
      label={ConstructionSiteDetailsKeysTranslation.plotAreaToBeBuiltOn}
      name="plotAreaToBeBuiltOn"
      multiline
      value={formik.values.plotAreaToBeBuiltOn}
      onChange={formik.handleChange}
      InputLabelProps={{
        shrink: true,
      }}
    />
    <TextField
      label={ConstructionSiteDetailsKeysTranslation.landPricePerSqm}
      name="landPricePerSqm"
      multiline
      value={formik.values.landPricePerSqm}
      onChange={formik.handleChange}
      InputLabelProps={{
        shrink: true,
      }}
    />
    <Stack direction="row">
      <LoadingButton
        disabled={!formik.dirty || !formik.errors}
        loading={props.isLoading}
        type="submit"
      >
        Speichern
      </LoadingButton>
    </Stack>
  </Grid>
}
