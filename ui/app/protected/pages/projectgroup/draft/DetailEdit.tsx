
import { ConstructionSiteDetailStats } from '@common/component/construction-site/ConstructionSiteDetailStats';
import { LoadingButton } from '@common/component/LoadingButton';
import { useBetterMutation } from '@common/hooks/useBetterMutationHook';
import { Alert, FormGroup, Grid, Snackbar, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import React, { FunctionComponent } from 'react';
import * as Yup from 'yup';
import { AdminConceptAssignmentDetailWithAttachments, UpdateConceptAssignmentRequest, updateDraft } from '../queries/concept-assignment';

interface Props {
    detail: AdminConceptAssignmentDetailWithAttachments
    updateFromMutation: (ca: AdminConceptAssignmentDetailWithAttachments) => void
}

function asDecimal(value: string | null): number | null {
  if (value === null) {
    return null
  }
  if (value.trim() === '') {
    return null;
  } else {
    const f = parseFloat(value)
    return isFinite(f) ? f : null
  }
}

// TODO localization of floats is awful here
const Schema = Yup.object().shape({
  allowedFloors: Yup.number().integer().min(1, 'Anzahl der erlaubten Etagen kann nicht <1 sein')
      .nullable().typeError('Anzahl der erlaubten Etagen muss eine Ganzzahl sein'),
  allowedBuildingHeightMeters: Yup.number().min(1, 'Höhe der erlaubten Gebäude kann nicht <1m sein')
      .nullable().typeError('Höhe der erlaubten Gebäude muss eine Zahl sein'),
  energyText: Yup.string().max(255, 'Energetische Vorgabe darf nicht länger als 255 Zeichen sein').nullable(),
})

export const DetailEdit: FunctionComponent<Props> = ({
  detail,
  updateFromMutation,
}) => {
  const [toasting, setToasting] = React.useState(false)
  const updateMutation = useBetterMutation((payload: UpdateConceptAssignmentRequest) => updateDraft(detail.assignment.id, payload),
      {
        onSuccess: (r) => {
          setToasting(true)
          updateFromMutation(r.data)
        },
      },
  )

  const formik = useFormik<{
      allowedFloors: string | null,
      allowedBuildingHeightMeters: string | null,
      energyText: string | null,
  }>({
    initialValues: {
      allowedBuildingHeightMeters: detail.assignment.details.allowedBuildingHeightMeters?.toString() || null,
      allowedFloors: detail.assignment.details.allowedFloors?.toString() || null,
      energyText: detail.assignment.details.energyText,
    },
    validationSchema: Schema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: (values) => {
      const payload: UpdateConceptAssignmentRequest = {
        details: {
          allowedBuildingHeightMeters: asDecimal(values.allowedBuildingHeightMeters),
          allowedFloors: asDecimal(values.allowedFloors),
          energyText: values.energyText?.trim() === '' ? null : values.energyText,
          buildingType: detail.assignment.details.buildingType,
        },
      }
      updateMutation.mutate(payload)
    },
  })

  return <>
    <ConstructionSiteDetailStats
      constructionSiteKey={detail.assignment.parcels[0]}
    />
    <form onSubmit={formik.handleSubmit}>
      <FormGroup>
        <Grid display="grid" gridTemplateColumns='1fr 1fr' columnGap={2} rowGap={1}>
          <TextField margin="dense" label="Zulässige Geschosse"
            name="allowedFloors"
            placeholder="3"
            value={formik.values.allowedFloors === null ? '' : formik.values.allowedFloors}
            onChange={formik.handleChange}
            error={!!formik.errors.allowedFloors}
            helperText={formik.errors.allowedFloors ? formik.errors.allowedFloors : null}
          />
          <TextField margin="dense" label="Zulässige Gebäudehöhe (in Meter)"
            name="allowedBuildingHeightMeters"
            placeholder="10.5"
            value={formik.values.allowedBuildingHeightMeters === null ? '' : formik.values.allowedBuildingHeightMeters}
            onChange={formik.handleChange}
            error={!!formik.errors.allowedBuildingHeightMeters}
            helperText={formik.errors.allowedBuildingHeightMeters ? formik.errors.allowedBuildingHeightMeters : null}
          />
          <Typography sx={{pb: 2}} variant="h6">Besondere Vorgaben</Typography>
        </Grid>
        <TextField
          multiline
          minRows={3}
          maxRows={8}
          id="energyText"
          label="Energetische Vorgaben"
          value={formik.values.energyText === null ? '' : formik.values.energyText}
          onChange={formik.handleChange}
          error={!!formik.errors.energyText}
          helperText={formik.errors.energyText ? formik.errors.energyText : null}
        />
      </FormGroup>
      <LoadingButton loading={updateMutation.isLoading} sx={{mt: 4}} variant='contained' type="submit" color='primary'>Speichern</LoadingButton>
      <Snackbar
        open={toasting}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={() => setToasting(false)} >
        <Alert onClose={() => setToasting(false)} severity="success">
    Gespeichert
        </Alert>
      </Snackbar>
    </form>
  </>
}
