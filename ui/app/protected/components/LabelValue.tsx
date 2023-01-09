import * as React from 'react';
import {Box, Stack, Typography} from '@mui/material';


export function LabelValue(
    props: {
        label: string,
        value: string
        extra?: React.ReactNode,
        position?: 'left' | 'center'
    },
) {
  const position = props.position || 'center'
  return <Box
    sx={{display: 'flex', flexDirection: 'column', alignItems: position,
      justifyItems: position, justifyContent: position, textAlign: position}}>
    <Typography variant="caption">
      {props.label}
    </Typography>

    <Stack direction="row" spacing={0.25} alignItems="center">
      <Typography variant="body2">
        {props.value}
      </Typography>
      {props.extra}
    </Stack>
  </Box>
}
