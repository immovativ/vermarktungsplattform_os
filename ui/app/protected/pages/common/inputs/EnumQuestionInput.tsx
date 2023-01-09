import React, {FunctionComponent, useEffect} from 'react';
import {EnumQuestion} from '@protected/pages/common/questions/questions';
import {MenuItem, Select, Typography} from '@mui/material';

interface Props {
  question: EnumQuestion
  answer: string | undefined
  onChange: (answer: string) => void
  readonly: boolean
}

export const EnumQuestionInput: FunctionComponent<Props> = React.memo((props) => {
  const [value, setValue] = React.useState<string>('');

  useEffect(() => {
    setValue(props.answer || '');
  }, [props.answer]);

  if (props.readonly) {
    return <Typography>{value}</Typography>
  }

  return <Select
    value={value}
    onChange={(event) => setValue(event.target.value)}
    onBlur={() => props.onChange(value)}
  >
    <MenuItem value="">&nbsp;</MenuItem>
    {props.question.values.map((value, index) =>
      <MenuItem key={`${props.question.id}-${index}`} value={value}>{value}</MenuItem>,
    )}
  </Select>
})
