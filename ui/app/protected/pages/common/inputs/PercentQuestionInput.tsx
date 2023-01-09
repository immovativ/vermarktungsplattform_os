import React, {FunctionComponent, useEffect} from 'react';
import {PercentQuestion} from '@protected/pages/common/questions/questions';
import {FormHelperText, TextField, Typography} from '@mui/material';
import * as Yup from 'yup';

interface Props {
  question: PercentQuestion
  answer: string | undefined
  onChange: (answer: string) => void
  readonly: boolean
}

const schema = Yup.object().shape({
  value: Yup.number()
      .min(0)
      .max(100)
      .required('Bitte geben Sie einen Wert an.'),
})

export const PercentQuestionInput: FunctionComponent<Props> = React.memo((props) => {
  const [value, setValue] = React.useState<string>('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  useEffect(() => {
    setValue(props.answer || '');
  }, [props.answer]);

  if (props.readonly) {
    return <Typography>{value}</Typography>
  }

  return <>
    <TextField
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
      }}
      onBlur={() => {
        if (value !== '') {
          schema.validate({value: value}).then(
              () => {
                props.onChange(value)
                setErrorMessage(null)
              },
              () => {
                setErrorMessage('Bitte geben Sie einen Wert zwischen 0 und 100 an.')
              },
          )
        } else {
          setErrorMessage(null)
          props.onChange(value) // Clear the field
        }
      }}
    />
    {errorMessage && <FormHelperText error={true}>{errorMessage}</FormHelperText>}
  </>
})
