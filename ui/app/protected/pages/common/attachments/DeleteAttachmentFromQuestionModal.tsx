import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography} from '@mui/material';
import React, {FunctionComponent} from 'react';
import {FileUploadQuestion, Question, replaceQuestion} from '@protected/pages/common/questions/questions';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {updateDraftQuestions} from '@protected/pages/projectgroup/queries/concept-assignment';
import {LoadingButton} from '@common/component/LoadingButton';

interface Props {
  conceptAssignmentId: string
  questionToDelete: FileUploadQuestion
  questions: readonly Question[]
  onClose: () => void
  onDelete: (attachmentId: string) => void
}

export const DeleteAttachmentFromQuestionModal: FunctionComponent<Props> = ({
  onClose,
  onDelete,
  conceptAssignmentId,
  questionToDelete,
  questions,
}) => {
  const mutation = useBetterMutation((question: FileUploadQuestion) => {
    const questionWithoutAttachment = {
      ...question,
      attachmentMetadata: undefined,
    } as FileUploadQuestion
    const newQuestions = replaceQuestion(questions, questionWithoutAttachment)

    return updateDraftQuestions(conceptAssignmentId, {questions: newQuestions})
  },
  {
    onSuccess: () => {
      questionToDelete.attachmentMetadata?.id && onDelete(questionToDelete.attachmentMetadata.id)
    },
  },
  )

  return <Dialog
    open={true}
    fullWidth
    maxWidth="sm"
    aria-label="Vorlage aus Frage löschen Dialog"
  >
    <DialogTitle>Vorlage aus Frage löschen?</DialogTitle>
    <DialogContent>
      <Stack direction="column" spacing={1}>
        <Typography variant="body1">
          Wollen Sie die Vorlage &quot;{questionToDelete.attachmentMetadata?.name}&quot; aus der
          Frage &quot;{questionToDelete.text}&quot; löschen?
        </Typography>
        {mutation.error && <Alert severity="error">{mutation.error.message}</Alert>}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onClose}>Abbrechen</Button>
      <LoadingButton
        loading={mutation.isLoading}
        variant="outlined"
        onClick={() => mutation.mutate(questionToDelete)}>
        Vorlage aus Frage löschen
      </LoadingButton>
    </DialogActions>
  </Dialog>
}
