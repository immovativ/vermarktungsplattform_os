import { Box, Stack, Typography } from '@mui/material';
import React, {FunctionComponent } from 'react';

interface Props {
    color: string
    label: string
}

export const LegendEntry: FunctionComponent<Props> = ({
  color,
  label,
}) => {
  return <Stack direction='column' spacing={1}>
    <Box alignSelf='center'><div style={{border: '1px solid #000', background: color, width: '50px', height: '1rem'}} /></Box>
    <Typography textAlign='center' variant='caption'>{label}</Typography>
  </Stack>
}
