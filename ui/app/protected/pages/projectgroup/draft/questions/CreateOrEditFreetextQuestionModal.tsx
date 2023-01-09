import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import {useFormik} from 'formik';
import React, {FunctionComponent} from 'react';
import * as Yup from 'yup';
import {v4} from 'uuid'
import { LoadingButton } from '@common/component/LoadingButton';
import { addQuestion, FreeTextQuestion, Question, replaceQuestion } from '@protected/pages/common/questions/questions';
import { BetterError } from '@common/util/BetterResponse';

interface CreateOrEditFreetextQuestionModalProps {
  questionToEdit: FreeTextQuestion | undefined
  questions: readonly Question[]
  update: (q: readonly Question[]) => void
  loading: boolean
  onClose: () => void
  error: BetterError<any> | null
}

const PercentQuestionSchema = Yup.object().shape({
  text: Yup.string().required('Bitte geben sie einen Text ein.').min(1).trim(),
  description: Yup.string(),
})

export const CreateOrEditFreetextQuestionModal: FunctionComponent<CreateOrEditFreetextQuestionModalProps> = ({
  questionToEdit,
  questions,
  update,
  onClose,
  loading,
  error,
}) => {
  const [required, setRequired] = React.useState<boolean>(true)
  const formik = useFormik<{ text: string, description: string }>({
    initialValues: {
      text: questionToEdit?.text || '',
      description: questionToEdit?.description || '',
    },
    validationSchema: PercentQuestionSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: (values) => {
      const question = {
        type: 'freeTextQuestion',
        id: questionToEdit?.id || v4(),
        text: values.text.trim(),
        description: values.description === '' ? undefined : values.description,
        required: required,
      } as FreeTextQuestion

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

  return <Dialog
    open={true}
    fullWidth
    maxWidth="lg"
    aria-label="Freitext-Frage anlegen Dialog"
  >
    <form onSubmit={formik.handleSubmit}>
      <DialogTitle>
        Freitext-Frage anlegen
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
