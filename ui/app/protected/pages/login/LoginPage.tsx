import {getSession} from '@common/navigation/session/Session';
import {LoadingButton} from '@common/component/LoadingButton';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {Alert, Box, Button, Card, CardContent, Container, TextField} from '@mui/material';
import {useFormik} from 'formik';
import React, {FunctionComponent, useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import * as Yup from 'yup';
import CardHeader from '@mui/material/CardHeader';
import {UserRole} from '@protected/model/user/UserRole';
import {
  login,
  LoginRequest,
  passwordForgotten,
  PasswordForgottenRequest,
} from '@protected/pages/common/profile/queries/profile';

type CurrentView = 'LOGIN' | 'PASSWORD_FORGOTTEN'

const ForgottenSchema = Yup.object().shape({
  email: Yup.string()
      .email('Bitte geben Sie eine valide E-Mail Adresse ein.')
      .required('Die E-Mail Adresse muss angegeben werden.'),
})

const LoginSchema = Yup.object().shape({
  email: Yup.string()
      .email('Bitte geben Sie eine valide E-Mail Adresse ein.')
      .required('Die E-Mail Adresse muss angegeben werden.'),
  password: Yup.string()
      .required('Das Passwort muss angegeben werden.'),
})

function enhanceMutationError(httpStatus: number | undefined, mutationMessage: string): string {
  if (httpStatus === 403) {
    return 'Falsches Passwort oder Konto existiert nicht'
  }
  if (httpStatus == 429) {
    return 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.'
  }
  return mutationMessage
}

export const LoginPage: FunctionComponent = () => {
  const [currentView, setCurrentView] = useState<CurrentView>('LOGIN')
  const navigate = useNavigate()
  const [searchParams, _] = useSearchParams()
  const isLoginAfterActivation = searchParams.get('after') === 'invitation'
  const isLoginAfterReset = searchParams.get('after') === 'pwreset'
  const conceptAssignmentId = searchParams.get('conceptAssignmentId')

  const mutation = useBetterMutation((payload: LoginRequest) =>
    login(payload),
  {
    onSuccess: () => {
      if (getSession()?.role === UserRole.CONSULTING) {
        navigate('/protected/consulting/texts')
      } else if (getSession()?.role === UserRole.CANDIDATE) {
        if (conceptAssignmentId) {
          // router doesn't work here, so we use window.location.href
          window.location.href = `/vergabe/${conceptAssignmentId}`
        } else {
          navigate('/protected/candidate/candidatures')
        }
      } else if (getSession()?.role === UserRole.PROJECT_GROUP) {
        navigate('/protected/admin/dashboard')
      }
    },
  },
  )

  const forgottenMutation = useBetterMutation((payload: PasswordForgottenRequest) =>
    passwordForgotten(payload),
  {},
  )

  useEffect(() => {
    const session = getSession()
    if (session !== null) {
      if (session.role === UserRole.PROJECT_GROUP) {
        navigate('/protected/admin/dashboard')
      } else if (session.role === UserRole.CONSULTING) {
        navigate('/protected/consulting/texts')
      } else if (session.role === UserRole.CANDIDATE) {
        navigate('/protected/candidate/candidatures')
      } else {
        navigate('/')
      }
    }
  }, [])

  const formik = useFormik<LoginRequest>({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: LoginSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      mutation.mutate(values)
    },
  })

  const forgottenFormik = useFormik<PasswordForgottenRequest>({
    initialValues: {
      email: '',
    },
    validationSchema: ForgottenSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      forgottenMutation.mutate(values)
    },
  })


  return (
    <Container maxWidth="xs">
      <Card>
        <CardHeader title={currentView === 'LOGIN' ? 'Login' : 'Passwort vergessen'}/>
        <CardContent>
          {currentView === 'LOGIN' && <Box component="form"
            sx={{display: 'flex', flexDirection: 'column'}}
            onSubmit={formik.handleSubmit}
          >
            {isLoginAfterActivation &&
              <Alert severity="info">
                {'Ihr Passwort wurde gesetzt. Bitte loggen Sie sich nun mit Ihrer E-Mail-Adresse und Ihrem neuen Passwort ein.'}
              </Alert>
            }
            {isLoginAfterReset &&
              <Alert severity="info">
                {'Ihr Passwort wurde gesetzt. Bitte loggen Sie sich nun mit Ihrer E-Mail-Adresse und Ihrem neuen Passwort ein.'}
              </Alert>
            }
            <TextField margin="dense" label="E-Mail Adresse" name="email"
              onChange={formik.handleChange}
              error={!!formik.errors.email}
              helperText={formik.errors.email ? formik.errors.email : null}
            />
            <TextField margin="dense" label="Passwort" type="password"
              name="password"
              onChange={formik.handleChange}
              error={!!formik.errors.password}
              helperText={formik.errors.password ? formik.errors.password : null}
            />
            {mutation.isError && <Alert severity="error" onClose={() => mutation.reset()}>{
              enhanceMutationError(mutation.error.status, mutation.error.message)}</Alert>}
            <LoadingButton loading={mutation.isLoading} type="submit" fullWidth variant="contained" sx={{mt: 3, mb: 2}}>
              Einloggen
            </LoadingButton>
            <Button onClick={() => setCurrentView('PASSWORD_FORGOTTEN')}
              variant="text">Ich habe mein Passwort vergessen</Button>
            <Button
              onClick={() => {
                const queryParams = new URLSearchParams()

                if (conceptAssignmentId) {
                  queryParams.set('conceptAssignmentId', conceptAssignmentId)
                }

                navigate({
                  pathname: '/protected/createAccount',
                  search: queryParams.toString(),
                })
              }}
              variant="text">Account erstellen</Button>
          </Box>}
          {currentView === 'PASSWORD_FORGOTTEN' && <Box component="form"
            sx={{display: 'flex', flexDirection: 'column'}}
            onSubmit={forgottenFormik.handleSubmit}>
            <TextField margin="dense" label="Ihre E-Mail Adresse" name="email"
              onChange={forgottenFormik.handleChange}
              error={!!forgottenFormik.errors.email}
              helperText={forgottenFormik.errors.email ? forgottenFormik.errors.email : null}
            />
            {forgottenMutation.isError &&
              <Alert severity="error">
                {forgottenMutation.error.status === 429 ? 'Zu viele Versuche. Bitte versuchen Sie es später erneut.' :
                  forgottenMutation.error.message}
              </Alert>
            }
            {forgottenMutation.isSuccess &&
              <Alert severity="success">
                Falls ein Konto mit dieser E-Mail Adresse existiert,
                wurde eine E-Mail mit einem Link zum Zurücksetzen des Passworts verschickt.
                Bitte folgen Sie den Anweisungen in dieser E-Mail.
              </Alert>
            }
            <LoadingButton disabled={forgottenMutation.isSuccess} loading={forgottenMutation.isLoading}
              type="submit" fullWidth variant="contained" sx={{mt: 3, mb: 2}}>
              Passwort zurücksetzen
            </LoadingButton>
            <Button onClick={() => {
              forgottenMutation.reset()
              setCurrentView('LOGIN')
            }}
            variant="text">Zurück zum Login</Button>
          </Box>}
        </CardContent>
      </Card>
    </Container>
  )
}
