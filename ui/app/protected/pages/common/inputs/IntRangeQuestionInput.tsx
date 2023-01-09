import React, {FunctionComponent} from 'react';
import {IntRangeQuestion} from '@protected/pages/common/questions/questions';
import { Typography} from '@mui/material';
import { IntRangeQuestionInputAsRadio } from './IntRangeQuestionInputAsRadio';
import { IntRangeQuestionInputAsField } from './IntRangeQuestionInputAsField';

interface Props {
  question: IntRangeQuestion
  answer: string | undefined
  onChange: (answer: string) => void
  readonly: boolean
}


export const IntRangeQuestionInput: FunctionComponent<Props> = (props) => {
  if (props.readonly) {
    return <Typography>{props.answer || ''}</Typography>
  }
  if (props.question.range.endInclusive - props.question.range.start > 10) {
    return <IntRangeQuestionInputAsField
      question={props.question}
      answer={props.answer}
      onChange={props.onChange}
    />
  } else {
    return <IntRangeQuestionInputAsRadio
      question={props.question}
      answer={props.answer}
      onChange={props.onChange}
    />
  }
}
