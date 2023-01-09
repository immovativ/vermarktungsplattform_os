import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material';
import {isString, useFormik} from 'formik';
import React, {FunctionComponent } from 'react';
import * as Yup from 'yup';
import {v4} from 'uuid'
import {Add, Delete} from '@mui/icons-material';
import { LoadingButton } from '@common/component/LoadingButton';
import { addQuestion, EnumQuestion, Question, replaceQuestion } from '@protected/pages/common/questions/questions';
import { BetterError } from '@common/util/BetterResponse';

interface CreateOrEditEnumQuestionModalProps {
  questionToEdit: EnumQuestion | undefined
  questions: readonly Question[]
  update: (q: readonly Question[]) => void
  loading: boolean
  onClose: () => void
  error: BetterError<any> | null
}

const EnumQuestionSchema = Yup.object().shape({
  text: Yup.string().required('Bitte geben sie einen Text ein.').min(1).trim(),
  description: Yup.string(),
  values: Yup.array().min(1).of(
      Yup.string().min(1).required('Die verwendeten Werte sind zu klein.'),
  ).required('Bitte geben Sie Werte an'),
})

function showValuesErrors(errors: (string | null)[] | string): string {
  if (isString(errors)) {
    return errors
  }

  const newErrors = errors.reduce((prev, curr, index) => {
    if (curr != null) {
      return [
        ...prev,
        `Wert ${index + 1}`,
      ]
    }

    return prev
  }, [] as string[])

  return `${newErrors.join(', ')} muss gesetzt sein.`
}

export const CreateOrEditEnumQuestionModal: FunctionComponent<CreateOrEditEnumQuestionModalProps> = ({
  questionToEdit,
  questions,
  update,
  onClose,
  loading,
  error,
}) => {
  const [required, setRequired] = React.useState<boolean>(true)
  const formik = useFormik<{
    text: string,
    description: string,
    values: string[]
  }>({
    initialValues: {
      text: questionToEdit?.text || '',
      description: questionToEdit?.description || '',
      values: questionToEdit?.values || [''],
    },
    validationSchema: EnumQuestionSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: (values) => {
      const question = {
        type: 'enumQuestion',
        id: questionToEdit?.id || v4(),
        text: values.text.trim(),
        description: values.description === '' ? undefined : values.description,
        values: values.values,
        required: required,
      } as EnumQuestion

      let newQuestions: readonly Question[]

      if (questionToEdit) {
        newQuestions = replaceQuestion(
            questions,
            question,
        )
      } else {
        newQuestions = addQuestion(
            questions,
            question,
        )
      }

      update(newQuestions)
    },
  })

  const setValueOnIndex = (value: string, index: number) => {
    const newValues = formik.values.values
    newValues.splice(index, 1, value)

    formik.setFieldValue('values', newValues)
  }

  const addValueAfterIndex = (index: number) => {
    const newValues = formik.values.values
    newValues.splice(index + 1, 0, '')

    formik.setFieldValue('values', newValues)
  }

  const removeValueFromIndex = (index: number) => {
    const newValues = formik.values.values
    newValues.splice(index, 1)

    formik.setFieldValue('values', newValues)
  }

  return <Dialog
    open={true}
    fullWidth
    maxWidth="lg"
    aria-label="Enum-Frage anlegen Dialog"
  >
    <form onSubmit={formik.handleSubmit}>
      <DialogTitle>
        Enum-Frage anlegen
      </DialogTitle>
      <DialogContent>
        <Stack direction="column">
          <FormGroup>
            <TextField
              margin="dense"
              label="Text"
              name="text"
              value={formik.values.text}
              onChange={formik.handleChange}
              error={!!formik.errors.text}
              helperText={formik.errors.text ? formik.errors.text : null}
            />
          </FormGroup>
          <FormGroup>
            <TextField
              margin="dense"
              label="Beschreibung"
              name="description"
              multiline
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              error={!!formik.errors.description}
              helperText={formik.errors.description ? formik.errors.description : null}
            />
          </FormGroup>
          <FormGroup>
            <FormControlLabel control={<Switch
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              inputProps={{ 'aria-label': 'controlled' }}
            />} label="Frage muss zwingend beantwortet werden" />
          </FormGroup>
          <FormGroup>
            {formik.values.values.map((_, index) => (
              <Stack direction="row" key={`value-${index}`} alignContent="center" spacing={1}>
                <TextField
                  sx={{flex: '1 1 100%'}}
                  label={`Wert ${index + 1}`}
                  margin="dense"
                  size="small"
                  value={formik.values.values[index]}
                  onChange={(e) => setValueOnIndex(e.target.value, index)}
                />

                <Tooltip title="Neuen Wert anlegen">
                  <>
                    <IconButton onClick={() => addValueAfterIndex(index)}>
                      <Add/>
                    </IconButton>
                  </>
                </Tooltip>

                <Tooltip title="Wert entfernen">
                  <>
                    <IconButton onClick={() => removeValueFromIndex(index)} disabled={index === 0}>
                      <Delete/>
                    </IconButton>
                  </>
                </Tooltip>
              </Stack>
            ))}
          </FormGroup>
          {!!formik.errors.values && <Alert severity="error">{showValuesErrors(formik.errors.values) || ''}</Alert>}
          {error && <Alert severity="error">{error.message}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>Abbrechen</Button>
        <LoadingButton loading={loading} variant="contained" type="submit">
          Speichern
        </LoadingButton>
      </DialogActions>
    </form>
  </Dialog>
}
