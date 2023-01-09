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
import { addQuestion, IntRangeQuestion, Question, replaceQuestion } from '@protected/pages/common/questions/questions';
import { BetterError } from '@common/util/BetterResponse';

interface CreateOrEditIntRangeQuestionModalProps {
  questionToEdit: IntRangeQuestion | undefined
  questions: readonly Question[]
  update: (q: readonly Question[]) => void
  loading: boolean
  onClose: () => void
  error: BetterError<any> | null
}

const IntRangeQuestionSchema = Yup.object().shape({
  text: Yup.string().required('Bitte geben sie einen Text ein.').min(1).trim(),
  description: Yup.string(),
  start: Yup.number().min(0).max(100).required('Bitte geben sie einen Start an.'),
  endInclusive: Yup.number().min(0).max(100).required('Bitte geben sie eine Ende an.'),
  startEndInclusive: Yup.string().when(['start', 'endInclusive'], {
    is: (start: number, endInclusive: number) => {
      return start >= endInclusive
    },
    then: Yup.string().required('Der Start darf nicht groesser oder gleich dem Ende sein!'),
  }),
})

export const CreateOrEditIntRangeQuestionModal: FunctionComponent<CreateOrEditIntRangeQuestionModalProps> = ({
  questionToEdit,
  questions,
  update,
  loading,
  onClose,
  error,
}) => {
  const [required, setRequired] = React.useState<boolean>(true)
  const formik = useFormik<{
    text: string,
    description: string,
    start: number,
    endInclusive: number,
    startEndInclusive: string
  }>({
    initialValues: {
      text: questionToEdit?.text || '',
      description: questionToEdit?.description || '',
      start: questionToEdit?.range?.start || 0,
      endInclusive: questionToEdit?.range?.endInclusive || 6,
      startEndInclusive: '',
    },
    validationSchema: IntRangeQuestionSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: (values) => {
      const question = {
        type: 'intRangeQuestion',
        id: questionToEdit?.id || v4(),
        text: values.text.trim(),
        description: values.description === '' ? undefined : values.description,
        range: {
          start: values.start,
          endInclusive: values.endInclusive,
        },
        required: required,
      } as IntRangeQuestion

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
    aria-label="Schulnoten-Frage anlegen Dialog"
  >
    <form onSubmit={formik.handleSubmit}>
      <DialogTitle>
        Schulnoten-Frage anlegen
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
            <TextField
              inputProps={{inputMode: 'numeric'}}
              margin="dense"
              label="Start"
              name="start"
              value={formik.values.start}
              onChange={formik.handleChange}
              error={!!formik.errors.start}
              helperText={formik.errors.start ? formik.errors.start : null}
            />
          </FormGroup>
          <FormGroup>
            <TextField
              inputProps={{inputMode: 'numeric'}}
              margin="dense"
              label="Ende"
              name="endInclusive"
              value={formik.values.endInclusive}
              onChange={formik.handleChange}
              error={!!formik.errors.endInclusive}
              helperText={formik.errors.endInclusive ? formik.errors.endInclusive : null}
            />
          </FormGroup>
          {!!formik.errors.startEndInclusive &&
            <Alert severity="error">{formik.errors.startEndInclusive}</Alert>}
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
