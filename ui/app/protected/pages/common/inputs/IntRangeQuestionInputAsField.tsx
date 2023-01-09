import React, {FunctionComponent, useEffect} from 'react';
import {IntRangeQuestion} from '@protected/pages/common/questions/questions';

import * as Yup from 'yup';
import { FormHelperText, TextField} from '@mui/material';

interface Props {
  question: IntRangeQuestion
  answer: string | undefined
  onChange: (answer: string) => void
}


export const IntRangeQuestionInputAsField: FunctionComponent<Props> = React.memo((props) => {
  const [enteredValue, setEnteredValue] = React.useState<string>('')
  const [errorDisplay, setErrorDisplay] = React.useState<string | null>(null)

  useEffect(() => {
    setEnteredValue(props.answer || '')
  }, [props.answer])

  const schema = Yup.object().shape({
    value: Yup.number().integer('Bitte geben Sie eine Ganzzahl an')
        .min(props.question.range.start)
        .max(props.question.range.endInclusive).required('Bitte geben Sie einen Wert an.'),
  })

  return <>
    <TextField
      variant="outlined"
      value={enteredValue}
      onBlur={() => {
        if (enteredValue !== '') {
          schema
              .validate({value: enteredValue})
              .then(
                  () => {
                    props.onChange(enteredValue)
                    setErrorDisplay(null)
                  },
                  () => {
                    setErrorDisplay(`Bitte geben Sie eine Ganzzahl zwischen ${props.question.range.start} und ${props.question.range.endInclusive} an.`)
                  },
              )
        } else {
          setErrorDisplay(null)
          props.onChange(enteredValue) // Clear the field
        }
      }}
      onChange={(e) => {
        setEnteredValue(e.target.value)
      }}
    />
    {errorDisplay && <FormHelperText error={true}>{errorDisplay}</FormHelperText>}
  </>
})
