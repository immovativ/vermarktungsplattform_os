import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
} from '@mui/material';
import { useFormik} from 'formik';
import React, {FunctionComponent } from 'react';
import * as Yup from 'yup';

import { useBetterMutation } from '@common/hooks/useBetterMutationHook';
import { changePassword, ChangePasswordRequest } from './queries/profile';
import { LoadingButton } from '@common/component/LoadingButton';

const ChangePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
      .required('Bitte geben Sie das aktuelle Passwort ein.')
      .trim(),
  newPassword: Yup.string()
      .min(8, 'Zu Ihrer Sicherheit sollte das Passwort mindestens 8 Zeichen lang sein.')
      .required('Bitte geben Sie ein neues Passwort ein.')
      .trim(),
  newPasswordConfirm: Yup.string()
      .oneOf([Yup.ref('newPassword'), null], 'Die Passwörter stimmen nicht überein.')
      .required('Bitte bestätigen Sie das neue Passwort.'),
})

interface ChangePasswordModalProps {
  onClose: () => void
}

export const ChangePasswordModal: FunctionComponent<ChangePasswordModalProps> = ({
  onClose,
}) => {
  const [succeeded, setSucceeded] = React.useState(false)
  const mutation = useBetterMutation((payload: ChangePasswordRequest) =>
    changePassword(payload),
  {
    onSuccess: () => {
      setSucceeded(true)
    },
  },
  )

  const formik = useFormik<ChangePasswordRequest & {newPasswordConfirm: string}>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    },
    validationSchema: ChangePasswordSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: (values) => {
      mutation.mutate({
        currentPassword: values.currentPassword.trim(),
        newPassword: values.newPassword.trim(),
      })
    },
  })

  return <Dialog
    open={true}
    fullWidth
    maxWidth="lg"
    aria-label="Passwort ändern Dialog"
  >
    <DialogTitle>Passwort ändern</DialogTitle>
    <DialogContent>
      {!succeeded && <Box component="form"
        sx={{display: 'flex', flexDirection: 'column', rowGap: 2}}
        onSubmit={formik.handleSubmit}
      >
        <TextField margin="dense" label="Bitte geben Sie das aktuelle Passwort ein" type="password"
          name="currentPassword"
          onChange={formik.handleChange}
          error={!!formik.errors.currentPassword}
          helperText={formik.errors.currentPassword ? formik.errors.currentPassword : null}
        />
        <Divider />
        <TextField margin="dense" label="Neues Passwort" type="password"
          name="newPassword"
          onChange={formik.handleChange}
          error={!!formik.errors.newPassword}
          helperText={formik.errors.newPassword ? formik.errors.newPassword : null}
        />
        <TextField margin="dense" label="Bitte bestätigen Sie das neue Passwort" type="password"
          name="newPasswordConfirm"
          onChange={formik.handleChange}
          error={!!formik.errors.newPasswordConfirm}
          helperText={formik.errors.newPasswordConfirm ? formik.errors.newPasswordConfirm : null}
        />
        <LoadingButton loading={mutation.isLoading} type="submit" fullWidth variant="contained" sx={{mt: 3, mb: 2}}>
                    Passwort ändern
        </LoadingButton>
      </Box>}
      {mutation.isError && <Alert severity="error" onClose={() => mutation.reset()}>{mutation.error.status === 403 ?
      'Bitte überprüfen Sie die Eingabe vom aktuellen Passwort.' : mutation.error.message}</Alert>}
      {mutation.isSuccess && <Alert severity="success" onClose={onClose}>
        Ihr Passwort wurde erfolgreich geändert</Alert>}
    </DialogContent>
    <DialogActions>
      {succeeded ? <Button onClick={onClose}>Schliessen</Button> :
      <Button variant="outlined" onClick={onClose}>Abbrechen</Button>}
    </DialogActions>
  </Dialog>
}
