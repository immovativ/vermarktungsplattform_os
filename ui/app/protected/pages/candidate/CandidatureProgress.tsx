import React, {FunctionComponent} from 'react';
import {Step, StepLabel, Stepper} from '@mui/material';
import {CandidatureQuestions} from '@protected/pages/projectgroup/queries/concept-assignment';
import {Check, Close} from '@mui/icons-material';

interface Props {
  errors: { [key: string]: string }
  questions: CandidatureQuestions | undefined
}

const successIcon = {icon: <Check fontSize="small" color="success"/>}
const errorIcon = {icon: <Close fontSize="small" color="error"/>}

export const CandidatureProgress: FunctionComponent<Props> = (props) => {
  const questions = props.questions
  const descriptionStepActive = !props.errors['description']

  if (!questions) {
    return <Stepper>
      <Step active={descriptionStepActive}>
        <StepLabel
          StepIconProps={descriptionStepActive ? successIcon : errorIcon}
        >
          Beschreibung
        </StepLabel>
      </Step>
    </Stepper>
  }

  const requiredQuestions = questions.questions.filter((question) => question.required).length
  const questionsWithErrors = questions.questions.filter((question) => props.errors[question.id]).length
  const answeredQuestions = requiredQuestions - questionsWithErrors

  const requiredQuestionsStepActive = questionsWithErrors === 0

  return <Stepper>
    <Step active={descriptionStepActive}>
      <StepLabel
        StepIconProps={descriptionStepActive ? successIcon : errorIcon}
      >
        Beschreibung
      </StepLabel>
    </Step>
    <Step active={requiredQuestionsStepActive}>
      <StepLabel
        StepIconProps={requiredQuestionsStepActive ? successIcon : errorIcon}
      >
        Pflichtfragen ({answeredQuestions} / {requiredQuestions} beantwortet)
      </StepLabel>
    </Step>
  </Stepper>
}
