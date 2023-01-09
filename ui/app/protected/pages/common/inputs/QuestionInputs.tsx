import React, {FunctionComponent} from 'react';
import {CandidatureQuestions} from '@protected/pages/projectgroup/queries/concept-assignment';
import {Box, FormGroup, FormLabel, Stack, Tooltip} from '@mui/material';
import {Question} from '@protected/pages/common/questions/questions';
import {FreeTextQuestionInput} from '@protected/pages/common/inputs/FreeTextQuestionInput';
import {EnumQuestionInput} from '@protected/pages/common/inputs/EnumQuestionInput';
import {PercentQuestionInput} from '@protected/pages/common/inputs/PercentQuestionInput';
import {InfoOutlined} from '@mui/icons-material';
import {FileUploadQuestionInput} from '@protected/pages/common/inputs/FileUploadQuestionInput';
import {CandidatureAndConceptAssignmentWithAttachments} from '@protected/model/candidature/Candidature';
import { IntRangeQuestionInput } from './IntRangeQuestionInput';

interface Props {
  candidature?: CandidatureAndConceptAssignmentWithAttachments
  questions: CandidatureQuestions | undefined
  answers: { [key: string]: string }
  onChange?: (answers: { [key: string]: string }, submit: boolean) => void
  readonly: boolean
}

function renderQuestionInput(
    question: Question,
    answers: { [key: string]: string },
    onChange: (questionId: string, value: string, submit: boolean) => void,
    readonly: boolean,
    candidature?: CandidatureAndConceptAssignmentWithAttachments,
): React.ReactNode {
  const answer = answers[question.id] || '';

  switch (question.type) {
    case 'freeTextQuestion':
      return <FreeTextQuestionInput
        question={question}
        answer={answer}
        onChange={(answer) => onChange(question.id, answer, false)}
        readonly={readonly}
      />

    case 'enumQuestion':
      return <EnumQuestionInput
        question={question}
        answer={answer}
        onChange={(answer) => onChange(question.id, answer, false)}
        readonly={readonly}
      />

    case 'percentQuestion':
      return <PercentQuestionInput
        question={question}
        answer={answer}
        onChange={(answer) => onChange(question.id, answer, false)}
        readonly={readonly}
      />

    case 'intRangeQuestion':
      return <IntRangeQuestionInput
        question={question}
        answer={answer}
        onChange={(answer) => onChange(question.id, answer, false)}
        readonly={readonly}
      />

    case 'fileUploadQuestion':
      return <FileUploadQuestionInput
        candidature={candidature}
        question={question}
        answer={answer}
        onChange={(answer) => onChange(question.id, answer, true)}
        readonly={readonly}
      />

    default:
      return null;
  }
}

export const QuestionInputs: FunctionComponent<Props> = (props) => {
  const onChange = (questionId: string, value: string, submit: boolean) => {
    props.onChange && props.onChange({...props.answers, [questionId]: value}, submit)
  }

  return (
    <Stack direction='column' spacing={1}>
      {props.questions && props.questions.questions.map((question) => {
        const required = props.readonly ? undefined : question.required

        return <Box key={question.id}>
          <FormGroup>
            <Stack direction="row" spacing={0.25}>
              {question.description && question.description.length > 0 ?
                <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{question.description}</span>}>
                  <InfoOutlined fontSize="small"/>
                </Tooltip> : null}

              <FormLabel required={required}>{question.text}</FormLabel>
            </Stack>

            {renderQuestionInput(
                question,
                props.answers,
                onChange,
                props.readonly,
                props.candidature,
            )}
          </FormGroup>
        </Box>
      })}
    </Stack>
  )
}
