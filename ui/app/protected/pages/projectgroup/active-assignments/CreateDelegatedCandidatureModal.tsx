import { LoadingButton } from '@common/component/LoadingButton'
import { useBetterMutation } from '@common/hooks/useBetterMutationHook'
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormGroup,
  Grid,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import {
  createDelegateAccount,
  DelegateCreationRequest,
  Salutation,
  SalutationTranslations,
  UserAccountType,
  UserAccountTypes,
  UserAccountTypeTranslations,
} from '@protected/pages/common/profile/queries/profile'
import axios from 'axios'
import { useFormik } from 'formik'
import React, { FC, useState } from 'react'
import { useQuery } from 'react-query'
import * as Yup from 'yup'
import { UserDataDisplay } from '../candidature/StandaloneProfilePage'
import { createDelegatedCandidature, UserData } from '../queries/candidature'
import { ConceptAssignmentDetail } from '../queries/concept-assignment'


interface CreateDelegateFormProps {
  onSelectUser: (i: UserData) => void
}

const DelegateCreationSchema = Yup.object().shape({
  accountType: Yup.string()
      .oneOf(Object.values(UserAccountTypes), 'Bitte wählen Sie einen Account Typ aus.'),
  company: Yup.string()
      .when('accountType', (accountType: UserAccountType) => {
        switch (accountType) {
          case 'COMPANY':
            return Yup.string().trim().min(1).required('Die Firma muss angegeben werden.')
          case 'PERSONAL':
            return Yup.string().nullable()
        }
      }),
  street: Yup.string()
      .trim()
      .min(1)
      .required('Bitte geben Sie eine Straße ein.'),
  houseNumber: Yup.string()
      .trim()
      .min(1)
      .required('Bitte geben Sie eine Hausnummer ein.'),
  zipCode: Yup.string()
      .trim()
      .min(1)
      .matches(/^[0-9]{5}$/, 'Bitte geben Sie eine gültige Postleitzahl ein.')
      .required('Bitte geben Sie eine Postleitzahl ein.'),
  city: Yup.string()
      .trim()
      .min(1)
      .required('Bitte geben Sie eine Stadt ein.'),
  email: Yup.string()
      .trim()
      .email('Bitte geben Sie eine valide E-Mail Adresse ein.')
      .required('Die E-Mail Adresse muss angegeben werden.'),
  firstName: Yup.string()
      .trim()
      .min(1)
      .required('Bitte geben Sie einen Vornamen ein.'),
  lastName: Yup.string()
      .trim()
      .min(1)
      .required('Bitte geben Sie einen Nachnamen ein.'),
  phoneNumber: Yup.string()
      .trim()
      .min(1)
      .required('Bitte geben Sie eine Telefonnummer ein.'),
})

export const CreateDelegateForm: FC<CreateDelegateFormProps> = (props) => {
  const createDelegateMutation = useBetterMutation((payload: DelegateCreationRequest) =>
    createDelegateAccount(payload),
  {
    onSuccess: (response) => {
      props.onSelectUser(response.data)
    },
  },
  )

  const formik = useFormik<DelegateCreationRequest>({
    initialValues: {
      accountType: 'COMPANY',
      company: '',
      salutation: 'HERR',
      street: '',
      houseNumber: '',
      zipCode: '',
      city: '',
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
    },
    validationSchema: DelegateCreationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      let payload: DelegateCreationRequest = values

      if (values.accountType === 'PERSONAL') {
        payload = { ...values, company: null }
      }

      createDelegateMutation.mutate(payload)
    },
  })

  return (
    <>
      <form onSubmit={formik.handleSubmit}>
        <Stack direction="column" spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormGroup>
                <Select<UserAccountType>
                  value={formik.values.accountType}
                  onChange={(event) => {
                    formik.setFieldValue('accountType', event.target.value)
                  }}
                >
                  <MenuItem value={'COMPANY'}>{UserAccountTypeTranslations['COMPANY']}</MenuItem>
                  <MenuItem value={'PERSONAL'}>{UserAccountTypeTranslations['PERSONAL']}</MenuItem>
                </Select>
              </FormGroup>
            </Grid>

            {formik.values.accountType === 'COMPANY' && <Grid item xs={6}>
              <FormGroup>
                <TextField
                  label="Firma"
                  name="company"
                  onChange={formik.handleChange}
                  error={!!formik.errors.company}
                  helperText={formik.errors.company ? formik.errors.company : null}
                />
              </FormGroup>
            </Grid>}
            <Grid item xs={formik.values.accountType === 'PERSONAL' ? 12 : 6}>
              <FormGroup>
                <Select<Salutation>
                  value={formik.values.salutation}
                  onChange={(event) => {
                    formik.setFieldValue('salutation', event.target.value)
                  }}
                >
                  <MenuItem value={'HERR'}>{SalutationTranslations['HERR']}</MenuItem>
                  <MenuItem value={'FRAU'}>{SalutationTranslations['FRAU']}</MenuItem>
                  <MenuItem value={'DIVERS'}>{SalutationTranslations['DIVERS']}</MenuItem>
                </Select>
              </FormGroup>
            </Grid>

            <Grid item xs={4}>
              <FormGroup>
                <TextField
                  label="Strasse"
                  name="street"
                  onChange={formik.handleChange}
                  error={!!formik.errors.street}
                  helperText={formik.errors.street ? formik.errors.street : null}
                />
              </FormGroup>
            </Grid>
            <Grid item xs={2}>
              <FormGroup>
                <TextField
                  label="Hausnummer"
                  name="houseNumber"
                  onChange={formik.handleChange}
                  error={!!formik.errors.houseNumber}
                  helperText={formik.errors.houseNumber ? formik.errors.houseNumber : null}
                />
              </FormGroup>
            </Grid>
            <Grid item xs={6}>
              <FormGroup>
                <TextField
                  label="Vorname"
                  name="firstName"
                  onChange={formik.handleChange}
                  error={!!formik.errors.firstName}
                  helperText={formik.errors.firstName ? formik.errors.firstName : null}
                />
              </FormGroup>
            </Grid>

            <Grid item xs={2}>
              <FormGroup>
                <TextField
                  label="PLZ"
                  name="zipCode"
                  onChange={formik.handleChange}
                  error={!!formik.errors.zipCode}
                  helperText={formik.errors.zipCode ? formik.errors.zipCode : null}
                />
              </FormGroup>
            </Grid>
            <Grid item xs={4}>
              <FormGroup>
                <TextField
                  label="Ort"
                  name="city"
                  onChange={formik.handleChange}
                  error={!!formik.errors.city}
                  helperText={formik.errors.city ? formik.errors.city : null}
                />
              </FormGroup>
            </Grid>
            <Grid item xs={6}>
              <FormGroup>
                <TextField
                  label="Nachname"
                  name="lastName"
                  onChange={formik.handleChange}
                  error={!!formik.errors.lastName}
                  helperText={formik.errors.lastName ? formik.errors.lastName : null}
                />
              </FormGroup>
            </Grid>

            <Grid item xs={6}>
              <FormGroup>
                <TextField
                  label="E-Mail-Adresse"
                  name="email"
                  onChange={formik.handleChange}
                  error={!!formik.errors.email}
                  helperText={formik.errors.email ? formik.errors.email : null}
                />
              </FormGroup>
            </Grid>
            <Grid item xs={6}>
              <FormGroup>
                <TextField
                  label="Telefonnummer"
                  name="phoneNumber"
                  onChange={formik.handleChange}
                  error={!!formik.errors.phoneNumber}
                  helperText={formik.errors.phoneNumber ? formik.errors.phoneNumber : null}
                />
              </FormGroup>
            </Grid>
          </Grid>
          {createDelegateMutation.isError &&
            (createDelegateMutation.error.status == 409 ?
              <Alert severity="error"
                onClose={createDelegateMutation.reset}>Eine Bewerber:in mit dieser E-Mail-Adresse existiert bereits.</Alert> :
              <Alert severity="error"
                onClose={createDelegateMutation.reset}>{createDelegateMutation.error.message}</Alert>)
          }
          <LoadingButton
            disabled={createDelegateMutation.isSuccess}
            loading={createDelegateMutation.isLoading}
            type="submit"
            variant="contained">
            Bewerber erstellen
          </LoadingButton>
        </Stack>
      </form>
    </>
  )
}


interface DelegatedUserListProps {
  onSelectUser: (i: UserData) => void
}

const DelegatedUserList: FC<DelegatedUserListProps> = (props) => {
  const data = useQuery(['delegates'], async () => (await axios.get<UserData[]>('/api/admin/candidate/delegate')).data)

  if (data.isLoading) {
    return <CircularProgress />
  }

  if (data.data?.length == 0) {
    return <Stack alignItems="center">
      <Typography variant="h5">Es wurden noch keine Bewerber:innen erfasst.</Typography>
    </Stack>
  }

  return <Table>
    <TableHead>
      <TableRow>
        <TableCell>
          Name
        </TableCell>
        <TableCell />
      </TableRow>
    </TableHead>
    <TableBody>
      {data.data?.map((i) => (
        <TableRow key={i.userId}>
          <TableCell>
            {i.firstName} {i.lastName}
          </TableCell>
          <TableCell align='right'>
            <Button
              size='small'
              onClick={() => props.onSelectUser(i)}
            >
              Auswählen
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
}


interface ConfirmDelegatedCandidatureProps {
  delegatedUser: UserData
}

const ConfirmDelegatedCandidature: FC<ConfirmDelegatedCandidatureProps> = ({ delegatedUser }) => {
  return <Card>
    <CardContent>
      <UserDataDisplay
        user={delegatedUser}
      />
    </CardContent>
  </Card>
}

interface CreateDelegatedCandidatureModalProps {
  assignmentId: string
  onCandidatureCreated?: (c: ConceptAssignmentDetail) => void
  onClose?: () => void
}

export const CreateDelegatedCandidatureModal: FC<CreateDelegatedCandidatureModalProps> = (props) => {
  const [createUserMode, setCreateUserMode] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const createDelegateMutation = useBetterMutation(
      ({ userId, assignmentId }) => createDelegatedCandidature(userId, assignmentId),
      {
        onSuccess: (response) => {
          props.onCandidatureCreated && props.onCandidatureCreated(response.data)
        },
      },
  )

  return <Dialog
    maxWidth="lg"
    fullWidth
    open
    onClose={props.onClose}
  >
    <DialogTitle>
      <Stepper alternativeLabel activeStep={selectedUser == null ? 0 : 1}>
        <Step>
          <StepLabel>
            Bewerber:in {createUserMode ? 'erfassen' : 'auswählen'}
          </StepLabel>
        </Step>
        <Step>
          <StepLabel>
            Bewerbung anlegen
          </StepLabel>
        </Step>
      </Stepper>
    </DialogTitle>
    <DialogContent>

      {selectedUser == null ?
        <>
          <Stack direction="row-reverse" sx={{ py: 1 }}>
            <Button
              onClick={() => setCreateUserMode(!createUserMode)}
            >
              {createUserMode ? 'Bestehende Bewerber:in auswählen' : 'Neue Bewerber:in erfassen'}
            </Button>
          </Stack>
          {createUserMode ?
            <CreateDelegateForm
              onSelectUser={(user) => setSelectedUser(user)}
            /> :
            <DelegatedUserList
              onSelectUser={(user) => setSelectedUser(user)}
            />}
        </> :
        <ConfirmDelegatedCandidature
          delegatedUser={selectedUser}
        />
      }
    </DialogContent>
    <DialogActions>
      {selectedUser != null &&
        <Button
          onClick={() => createDelegateMutation.mutate({
            userId: selectedUser.userId,
            assignmentId: props.assignmentId,
          })}
        >
          Bewerbung anlegen
        </Button>

      }
    </DialogActions>
  </Dialog>
}
