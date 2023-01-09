import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle} from '@mui/material';
import React, {FunctionComponent} from 'react';
import { LoadingButton } from '@common/component/LoadingButton';
import { Question } from '@protected/pages/common/questions/questions';
import { BetterError } from '@common/util/BetterResponse';

interface DeleteQuestionModalProps {
  questions: readonly Question[]
  update: (q: readonly Question[]) => void
  question: Question
  loading: boolean
  onClose: () => void
  error: BetterError<any> | null
}

export const DeleteQuestionModal: FunctionComponent<DeleteQuestionModalProps> = ({
  questions,
  update,
  question,
  onClose,
  loading,
  error,
}) => {
  const onSubmit = () => {
    const newQuestions: readonly Question[] = questions.filter((q) => q.id !== question.id)

    update(newQuestions)
  }

  return <Dialog
    open={true}
    onClose={onClose}
    aria-label={'Frage entfernen Dialog'}
  >
    <DialogTitle>
      Frage &quot;{question.text}&quot; entfernen?
    </DialogTitle>
    <DialogContent>
      {error && <Alert severity="error">{error.message}</Alert>}
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onClose}>Abbrechen</Button>
      <LoadingButton loading={loading} variant="contained" onClick={onSubmit}>
        Entfernen
      </LoadingButton>
    </DialogActions>
  </Dialog>
}
