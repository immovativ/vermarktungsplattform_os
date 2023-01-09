import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useFormik} from 'formik';
import React, {FunctionComponent } from 'react';
import * as Yup from 'yup';

import { useBetterMutation } from '@common/hooks/useBetterMutationHook';
import { changePersonalData } from './queries/profile';
import { LoadingButton } from '@common/component/LoadingButton';

const ChangePersonalDataSchema = Yup.object().shape({
  name: Yup.string()
      .min(1, 'Bitte geben Sie einen Namen für die nutzende Person an.')
      .max(255, 'Der Name darf nicht länger als 255 Zeichen sein.')
      .required('Bitte geben Sie einen neuen Profilnamen ein.')
      .trim(),
})

interface ChangePersonalDataModalProps {
  onClose: () => void
  currentName: string
}

export const ChangePersonalDataModal: FunctionComponent<ChangePersonalDataModalProps> = ({
  onClose,
  currentName,
}) => {
  const mutation = useBetterMutation((payload: {name: string}) =>
    changePersonalData(payload),
  {
    onSuccess: () => {
      onClose()
    },
  },
  )

  const formik = useFormik<{name: string}>({
    initialValues: {
      name: currentName,
    },
    validationSchema: ChangePersonalDataSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: (values) => {
      mutation.mutate({name: values.name.trim()})
    },
  })

  return <Dialog
    open={true}
    fullWidth
    maxWidth="lg"
    aria-label="Stammdaten ändern Dialog"
  >
    <form onSubmit={formik.handleSubmit}>
      <DialogTitle>Stammdaten ändern</DialogTitle>
      <DialogContent>
        <Box
          sx={{display: 'flex', flexDirection: 'column', rowGap: 2}}
        >
          <TextField margin="dense" label="Name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            error={!!formik.errors.name}
            helperText={formik.errors.name ? formik.errors.name : null}
          />
        </Box>
        {mutation.isError && <Alert severity="error" onClose={() => mutation.reset()}>{mutation.error}</Alert>}
        {mutation.isSuccess && <Alert severity="success" onClose={onClose}>
        Ihr Passwort wurde erfolgreich geändert</Alert>}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>Abbrechen</Button>
        <LoadingButton loading={mutation.isLoading} type="submit" variant="contained">
                    Speichern
        </LoadingButton>
      </DialogActions>
    </form>
  </Dialog>
}
