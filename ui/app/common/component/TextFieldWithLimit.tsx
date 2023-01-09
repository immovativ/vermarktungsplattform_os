import React, {FunctionComponent, useCallback, useState} from 'react';
import {Stack, TextField} from '@mui/material';
import {TextFieldProps} from '@mui/material/TextField/TextField';
import {Box} from '@mui/system';
import debounce from 'lodash.debounce';

interface TextFieldWithLimitProps {
  limit: number
  initialValue: string
  debounceWait?: number

  onValueChange: (value: string) => void
}

export const TextFieldWithLimit: FunctionComponent<TextFieldWithLimitProps & TextFieldProps> = ({
  limit,
  initialValue,
  onValueChange,
  debounceWait,
  ...props
}) => {
  const [
    value,
    setValue,
  ] = useState<string>(initialValue)

  const debounced = useCallback(debounce(onValueChange, debounceWait ? debounceWait : 1000), [])

  return <Stack direction="column">
    <TextField
      {...props}
      inputProps={{maxLength: limit}}
      value={value}
      variant="outlined"
      multiline
      rows={4}
      onBlur={() => onValueChange(value.trim())}
      onChange={(e) => {
        const newValue = e.target.value.slice(0, limit)

        setValue(newValue)
        debounced(newValue.trim())
      }}
    />
    <Stack direction="row" justifyContent="end">
      <Box>{value.length}/{limit}</Box>
    </Stack>
  </Stack>
}
