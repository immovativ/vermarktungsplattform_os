import React, {FunctionComponent, useEffect} from 'react';
import {FreeTextQuestion} from '@protected/pages/common/questions/questions';
import {TextField, Typography} from '@mui/material';

interface Props {
  question: FreeTextQuestion
  answer: string | undefined
  onChange: (answer: string) => void
  readonly: boolean
}

export const FreeTextQuestionInput: FunctionComponent<Props> = React.memo((props) => {
  const [value, setValue] = React.useState<string>('');

  useEffect(() => {
    setValue(props.answer || '');
  }, [props.answer]);

  if (props.readonly) {
    return <Typography>{value}</Typography>
  }

  return <TextField
    value={value}
    rows={4}
    multiline
    onChange={(event) => setValue(event.target.value)}
    onBlur={() => props.onChange(value)}
  />
})
