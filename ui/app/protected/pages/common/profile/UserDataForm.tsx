import React, {FunctionComponent, useEffect} from 'react';
import {UserData} from '@protected/pages/projectgroup/queries/candidature';
import * as Yup from 'yup';
import {
  Salutation, SalutationTranslations, updateUserData,
  UserAccountType,
  UserAccountTypes, UserAccountTypeTranslations,
  UserDataUpdateRequest,
} from '@protected/pages/common/profile/queries/profile';
import {useFormik} from 'formik';
import {
  Alert,
  Card, CardContent, CardHeader,
  FormGroup,
  Grid,
  MenuItem,
  Select,
  Stack,
  TextField, Typography,
} from '@mui/material';
import {LoadingButton} from '@common/component/LoadingButton';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {formatDate} from '@common/util/DateFormatter';

const UserDataFormSchema = Yup.object().shape({
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

interface Props {
  userData: UserData
  onChange: () => void
}

export const UserDataForm: FunctionComponent<Props> = (props) => {
  const userData = props.userData

  const updateUserDataMutation = useBetterMutation((payload: UserDataUpdateRequest) => updateUserData(payload),
      {
        onSuccess: () => {
          props.onChange()
        },
      },
  )

  const formik = useFormik<UserDataUpdateRequest>({
    initialValues: {
      accountType: 'COMPANY',
      company: '',
      salutation: 'HERR',
      street: '',
      houseNumber: '',
      zipCode: '',
      city: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
    },
    validationSchema: UserDataFormSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      let payload: UserDataUpdateRequest = values

      if (values.accountType === 'PERSONAL') {
        payload = {...values, company: null}
      }

      updateUserDataMutation.mutate(payload)
    },
  })

  useEffect(() => {
    formik.setValues({
      accountType: userData.accountType,
      company: userData.company || '',
      salutation: userData.salutation,
      street: userData.street,
      houseNumber: userData.houseNumber,
      zipCode: userData.zipCode,
      city: userData.city,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
    })
  }, [userData])

  return <Card>
    <CardHeader title={
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <Typography variant="h6">
          Persönliche Daten
        </Typography>

        <Typography variant="body2">
          Letzte Aktualisierung: {formatDate(userData.updatedAt)}
        </Typography>
      </Stack>
    }
    />
    <CardContent>
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
                  value={formik.values.company}
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
                  value={formik.values.street}
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
                  value={formik.values.houseNumber}
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
                  value={formik.values.firstName}
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
                  value={formik.values.zipCode}
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
                  value={formik.values.city}
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
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  error={!!formik.errors.lastName}
                  helperText={formik.errors.lastName ? formik.errors.lastName : null}
                />
              </FormGroup>
            </Grid>

            <Grid item xs={12}>
              <FormGroup>
                <TextField
                  label="Telefonnummer"
                  name="phoneNumber"
                  value={formik.values.phoneNumber}
                  onChange={formik.handleChange}
                  error={!!formik.errors.phoneNumber}
                  helperText={formik.errors.phoneNumber ? formik.errors.phoneNumber : null}
                />
              </FormGroup>
            </Grid>
          </Grid>

          {updateUserDataMutation.isError &&
            <Alert
              severity="error"
              onClose={updateUserDataMutation.reset}
            >
              {updateUserDataMutation.error.message}
            </Alert>
          }

          <LoadingButton
            loading={updateUserDataMutation.isLoading}
            type="submit"
            variant="contained">
            Speichern
          </LoadingButton>
        </Stack>
      </form>
    </CardContent>
  </Card>
}
