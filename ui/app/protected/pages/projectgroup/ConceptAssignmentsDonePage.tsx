import { Stack } from '@mui/material';
import React, {FunctionComponent } from 'react';
import { DoneList } from './archive/DoneList';

export const ConceptAssignmentsDonePage: FunctionComponent<Record<string, never>> = ({ }) => {
  return <Stack direction="column" spacing={1}>
    <DoneList />
  </Stack>
}
