import React, {FunctionComponent, useEffect} from 'react';
import {IntRangeQuestion} from '@protected/pages/common/questions/questions';
import {FormControl, FormControlLabel, Radio, RadioGroup} from '@mui/material';

interface Props {
  question: IntRangeQuestion
  answer: string | undefined
  onChange: (answer: string) => void
}


export const IntRangeQuestionInputAsRadio: FunctionComponent<Props> = React.memo((props) => {
  const [value, setValue] = React.useState<string>('');

  useEffect(() => {
    setValue(props.answer || '');
  }, [props.answer]);

  const radioGroupChildren = []

  for (let index = props.question.range.start; index <= props.question.range.endInclusive; index++) {
    radioGroupChildren.push(
        <FormControlLabel key={`${props.question.id}-${index}`} value={index} control={<Radio />} label={index} />,
    )
  }

  return <FormControl>
    <RadioGroup
      row
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => props.onChange(value)}
    >
      {radioGroupChildren}
    </RadioGroup>
  </FormControl>
})
