import React, {FunctionComponent} from 'react';
import {
  Alert, Button,
  Card,
  CardContent, Checkbox,
  FormControlLabel,
  FormGroup, FormHelperText,
  Grid,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import CardHeader from '@mui/material/CardHeader';
import * as Yup from 'yup';
import {useFormik} from 'formik';
import {
  createUserAccount,
  Salutation, SalutationTranslations,
  UserAccountType, UserAccountTypes,
  UserAccountTypeTranslations,
  UserCreationRequest,
} from '@protected/pages/common/profile/queries/profile';
import {LoadingButton} from '@common/component/LoadingButton';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {TextsDialog} from '@protected/pages/login/TextsDialog';
import {ButtonLink} from '@common/component/ButtonLink';

const AccountCreationSchema = Yup.object().shape({
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
  tosAndPrivacyPolicyConsent: Yup.boolean()
      .oneOf([true], 'Bitte akzeptieren Sie die AGBs und Datenschutzbestimmungen.'),
})

export const AccountCreationPage: FunctionComponent = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const createUserAccountMutation = useBetterMutation((payload: UserCreationRequest) =>
    createUserAccount(payload, search.get('conceptAssignmentId')),
  {
    onSuccess: () => {
      setShowSuccess(true);
    },
  },
  )

  const [showSuccess, setShowSuccess] = React.useState(false)
  const [showDialog, setShowDialog] = React.useState(false)

  const formik = useFormik<UserCreationRequest>({
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
      tosAndPrivacyPolicyConsent: false,
    },
    validationSchema: AccountCreationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      let payload: UserCreationRequest = values

      if (values.accountType === 'PERSONAL') {
        payload = {...values, company: null}
      }

      createUserAccountMutation.mutate(payload)
    },
  })

  return (
    <>
      {showDialog && <TextsDialog onClose={() => setShowDialog(false)}/>}
      <Card>
        <CardHeader title="Account einrichten"/>
        <CardContent>
          {showSuccess ?
            <Alert severity="success" action={<ButtonLink href="/protected/login">Zurück zum Login</ButtonLink>}>
              {formik.values.firstName} {formik.values.lastName} vielen Dank für die Registrierung.
              Sie erhalten in Kürze eine E-Mail an die E-Mail-Adresse <u>{formik.values.email}</u> mit einem Link zur
              Vergabe des Passworts.
            </Alert> :
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
                  <Grid item xs={12}>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formik.values.tosAndPrivacyPolicyConsent}
                            onChange={(event) => {
                              formik.setFieldValue('tosAndPrivacyPolicyConsent', event.target.checked)
                            }}
                          />
                        }
                        label={
                          <span>
                        Ich habe die
                            &nbsp;<a onClick={() => setShowDialog(true)}
                              href="#">Nutzungs- und Datenschutzbestimmungen</a>&nbsp;
                            der Vergabeplattform gelesen und bin damit einverstanden.
                          </span>
                        }
                      />
                      {formik.errors.tosAndPrivacyPolicyConsent &&
                        <FormHelperText error={true}>{formik.errors.tosAndPrivacyPolicyConsent}</FormHelperText>}
                    </FormGroup>
                  </Grid>
                </Grid>
                {createUserAccountMutation.isError &&
                  <Alert severity="error"
                    onClose={createUserAccountMutation.reset}>{createUserAccountMutation.error.message}</Alert>
                }
                <LoadingButton
                  disabled={createUserAccountMutation.isSuccess}
                  loading={createUserAccountMutation.isLoading}
                  type="submit"
                  variant="contained">
                  Account einrichten
                </LoadingButton>
                <Button onClick={() => {
                  navigate({
                    pathname: '/protected/login',
                  })
                }}
                variant="text">Ich habe bereits einen Account</Button>
              </Stack>
            </form>}
        </CardContent>
      </Card>
    </>
  )
}
