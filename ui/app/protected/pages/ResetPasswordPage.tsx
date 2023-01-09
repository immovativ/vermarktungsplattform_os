import {LoadingButton} from '@common/component/LoadingButton';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {Alert, Box, Card, CardContent, Container, TextField} from '@mui/material';
import {useFormik} from 'formik';
import React, {FunctionComponent} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import * as Yup from 'yup';
import CardHeader from '@mui/material/CardHeader';
import {resetPassword} from '@protected/pages/common/profile/queries/profile';

interface ResetPasswordRequest {
  password: string
  passwordConfirm: string
}

const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
      .min(8, 'Zu Ihrer Sicherheit sollte das Passwort mindestens 8 Zeichen lang sein.')
      .required('Das Passwort muss angegeben werden.')
      .trim(),
  passwordConfirm: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Die Passwörter stimmen nicht überein.')
      .required('Das Passwort muss bestätigt werden.'),
})

interface ResetPasswordProps {
  mode: 'invitation' | 'resetPassword'
}

export const ResetPasswordPage: FunctionComponent<ResetPasswordProps> = (props) => {
  const {mode} = props
  const {token} = useParams()

  const navigate = useNavigate()
  const [search] = useSearchParams()

  const mutation = useBetterMutation((payload: { password: string, token: string }) =>
    resetPassword(payload),
  {
    onSuccess: () => {
      const queryParameters = new URLSearchParams()

      if (mode === 'invitation') {
        queryParameters.set('after', 'invitation')
      } else {
        queryParameters.set('after', 'pwreset')
      }

      const conceptAssignmentId = search.get('conceptAssignmentId')

      if (conceptAssignmentId) {
        queryParameters.set('conceptAssignmentId', conceptAssignmentId)
      }

      navigate({
        pathname: '/protected/login',
        search: queryParameters.toString(),
      })
    },
  },
  )

  const formik = useFormik<ResetPasswordRequest>({
    initialValues: {
      password: '',
      passwordConfirm: '',
    },
    validationSchema: ResetPasswordSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      mutation.mutate({password: values.password.trim(), token: token || ''})
    },
  })

  return (
    <Container maxWidth="xs">
      <Card>
        <CardHeader title={mode === 'resetPassword' ? 'Neues Passwort setzen' : 'Aktivieren Sie Ihr Konto'}/>
        <CardContent>
          <Box component="form"
            sx={{display: 'flex', flexDirection: 'column'}}
            onSubmit={formik.handleSubmit}
          >
            <TextField margin="dense" label="Passwort" type="password"
              name="password"
              onChange={formik.handleChange}
              error={!!formik.errors.password}
              helperText={formik.errors.password ? formik.errors.password : null}
            />
            <TextField margin="dense" label="Bitte bestätigen Sie ihr Passwort" type="password"
              name="passwordConfirm"
              onChange={formik.handleChange}
              error={!!formik.errors.passwordConfirm}
              helperText={formik.errors.passwordConfirm ? formik.errors.passwordConfirm : null}
            />
            {mutation.isError &&
              <Alert severity="error" onClose={() => mutation.reset()}>{mutation.error.status === 403 ?
                `Dieser ${mode === 'invitation' ? 'Einladungslink' : 'Passwort-Vergessen Link'} ist nicht mehr gültig. \
              Bitte kontaktieren Sie den Support oder fordern Sie einen neuen Link an.` :
                mutation.error.message}</Alert>}
            <LoadingButton loading={mutation.isLoading} type="submit" fullWidth variant="contained" sx={{mt: 3, mb: 2}}>
              Passwort setzen
            </LoadingButton>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}
