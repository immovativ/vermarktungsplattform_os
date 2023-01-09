import {
  EnumQuestion, FileUploadQuestion, FreeTextQuestion, IntRangeQuestion, PercentQuestion,
  Question, QuestionType, QuestionTypes, QuestionTypeTranslations,
} from '@protected/pages/common/questions/questions';
import React, { FunctionComponent, useState } from 'react';
import { AdminConceptAssignmentDetailWithAttachments, updateDraftQuestions } from '../queries/concept-assignment';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Fab,
  Grid,
} from '@mui/material';
import { CreateOrEditPercentQuestionModal } from './questions/CreateOrEditPercentQuestionModal';
import { CreateOrEditIntRangeQuestionModal } from './questions/CreateOrEditIntRangeQuestionModal';
import { CreateOrEditEnumQuestionModal } from './questions/CreateOrEditEnumQuestionModal';
import { CreateOrEditFreetextQuestionModal } from './questions/CreateOrEditFreetextQuestionModal';
import { DeleteQuestionModal } from './questions/DeleteQuestionModal';
import {FileUpload, List, Numbers, Percent, Subject} from '@mui/icons-material';
import { QuestionCard } from './questions/QuestionCard';
import { useBetterMutation } from '@common/hooks/useBetterMutationHook';
import {
  CreateOrEditFileUploadQuestionModal,
} from '@protected/pages/projectgroup/draft/questions/CreateOrEditFileUploadQuestionModal';

export const QuestionTypeIcon: Record<QuestionType, React.ReactElement> = {
  enumQuestion: <List fontSize='small' />,
  percentQuestion: <Percent fontSize='small'/>,
  intRangeQuestion: <Numbers fontSize='small'/>,
  freeTextQuestion: <Subject fontSize='small'/>,
  fileUploadQuestion: <FileUpload fontSize='small'/>,
}

interface Props {
    detail: AdminConceptAssignmentDetailWithAttachments
    readonly?: boolean
    updateFromMutation: (ca: AdminConceptAssignmentDetailWithAttachments) => void
}

export const QuestionEdit: FunctionComponent<Props> = ({
  detail,
  updateFromMutation,
  readonly,
}) => {
  const questions: readonly Question[] = detail.assignment.questions?.questions ?? []
  const [createModalOpen, setCreateOrEditModalOpen] = useState(false)
  const [createOrEditQuestionType, setCreateOrEditQuestionType] =
    useState<QuestionType>('freeTextQuestion')

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<Question | undefined>(undefined)
  const [questionToEdit, setQuestionToEdit] = useState<Question | undefined>(undefined)
  const onCreateOrEditQuestion = (questionToEdit: Question | undefined, questionType: QuestionType) => {
    mutation.reset()
    setCreateOrEditQuestionType(questionType)
    setQuestionToEdit(questionToEdit)
    setCreateOrEditModalOpen(true)
  }
  const afterUpdate = () => {
    setDeleteModalOpen(false)
    setCreateOrEditModalOpen(false)
    setQuestionToDelete(undefined)
  }
  const mutation = useBetterMutation((payload: readonly Question[]) => updateDraftQuestions(detail.assignment.id, {questions: payload}),
      {
        onSuccess: (r) => {
          afterUpdate()
          updateFromMutation(r.data)
        },
      },
  )
  const onQuestionSort = (
      direction: 'up' | 'down',
      question: Question,
  ) => {
    const questionIndex = questions.indexOf(question)

    if ((direction === 'up' && questionIndex === 0) ||
      (direction === 'down' && questionIndex === (questions.length - 1))) {
      return
    }

    let newIndex;

    if (direction === 'up') {
      newIndex = questionIndex - 1
    } else {
      newIndex = questionIndex + 1
    }

    const result = [...questions]
    result.splice(questionIndex, 1);
    result.splice(newIndex, 0, question)

    mutation.mutate(result)
  }
  return <>
    {createModalOpen && createOrEditQuestionType === 'percentQuestion' &&
        <CreateOrEditPercentQuestionModal
          questionToEdit={questionToEdit ? questionToEdit as PercentQuestion : undefined}
          questions={questions}
          update={mutation.mutate}
          loading={mutation.isLoading}
          onClose={() => {
            setCreateOrEditModalOpen(false)
          }}
          error={mutation.error}
        />
    }
    {createModalOpen && createOrEditQuestionType === 'intRangeQuestion' &&
        <CreateOrEditIntRangeQuestionModal
          questionToEdit={questionToEdit ? questionToEdit as IntRangeQuestion : undefined}
          questions={questions}
          update={mutation.mutate}
          loading={mutation.isLoading}
          onClose={() => {
            setCreateOrEditModalOpen(false)
          }}
          error={mutation.error}
        />
    }
    {createModalOpen && createOrEditQuestionType === 'enumQuestion' &&
        <CreateOrEditEnumQuestionModal
          questionToEdit={questionToEdit ? questionToEdit as EnumQuestion : undefined}
          questions={questions}
          update={mutation.mutate}
          loading={mutation.isLoading}
          onClose={() => {
            setCreateOrEditModalOpen(false)
          }}
          error={mutation.error}
        />
    }
    {createModalOpen && createOrEditQuestionType === 'freeTextQuestion' &&
        <CreateOrEditFreetextQuestionModal
          questionToEdit={questionToEdit ? questionToEdit as FreeTextQuestion : undefined}
          questions={questions}
          update={mutation.mutate}
          loading={mutation.isLoading}
          onClose={() => {
            setCreateOrEditModalOpen(false)
          }}
          error={mutation.error}
        />
    }
    {createModalOpen && createOrEditQuestionType === 'fileUploadQuestion' &&
        <CreateOrEditFileUploadQuestionModal
          questionToEdit={questionToEdit ? questionToEdit as FileUploadQuestion : undefined}
          questions={questions}
          update={mutation.mutate}
          loading={mutation.isLoading}
          attachments={detail.attachments}
          onClose={() => {
            setCreateOrEditModalOpen(false)
          }}
          error={mutation.error}
        />
    }
    {deleteModalOpen && questionToDelete &&
        <DeleteQuestionModal
          questions={questions}
          update={mutation.mutate}
          loading={mutation.isLoading}
          onClose={() => {
            setDeleteModalOpen(false)
            setQuestionToDelete(undefined)
          }}
          question={questionToDelete}
          error={mutation.error}
        />}
    <Card variant='outlined'>
      <Box sx={{backgroundColor: '#fafafa', p: 2, pb: 4, display: 'flex'}}>
        <Box sx={{flex: '1 1 100%', minHeight: '56px'}}>
          <Typography variant="h6">Bewerbungsfragen</Typography>
        </Box>
      </Box>
      <CardContent sx={{pt: 0}}>
        {!readonly && <Stack direction="row" justifyContent="end" sx={{position: 'relative', top: '-20px'}} spacing={1}>
          {QuestionTypes.map((questionType) => (
            <Tooltip
              key={QuestionTypeTranslations[questionType].name}
              title={QuestionTypeTranslations[questionType].description}
            >
              <Fab
                onClick={() => onCreateOrEditQuestion(undefined, questionType)}
                color="primary"
                size="small"
              >
                {QuestionTypeIcon[questionType]}
              </Fab>
            </Tooltip>
          ))}
        </Stack>}
        <Stack direction="column" spacing={1} sx={{pt: 7, minHeight: '220px'}}>
          <Grid container display="grid" gridTemplateColumns="repeat(1, 1fr)" gap={1}>
            {questions.length === 0 &&
            <Box sx={{minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
              <Typography variant="h5" color='grey.600'>Es sind keine Bewerbungsfragen vorhanden.</Typography>
              {!readonly && <Typography variant="body2" color='grey.400'>
                Benutzen Sie die Buttons um eine neue Frage zu erstellen.
              </Typography>}
            </Box>
            }
            {questions.map((question, questionIndex) =>
              <QuestionCard
                key={question.id}
                readonly={readonly}
                question={question}
                moveDownEnabled={questionIndex < (questions.length - 1)}
                moveUpEnabled={questionIndex !== 0}
                onEdit={() => onCreateOrEditQuestion(question, question.type)}
                onDelete={() => {
                  mutation.reset()
                  setQuestionToDelete(question)
                  setDeleteModalOpen(true)
                }}
                onMoveDown={() => onQuestionSort('down', question)}
                onMoveUp={() => onQuestionSort('up', question)}
              />,
            )}
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  </>
}
