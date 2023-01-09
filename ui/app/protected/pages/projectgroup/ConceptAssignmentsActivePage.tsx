
import { Stack } from '@mui/material';
import React, {FunctionComponent } from 'react';
import { ActiveList } from './active-assignments/ActiveList';

export const ConceptAssignmentsActivePage: FunctionComponent<Record<string, never>> = ({ }) => {
  return <Stack direction="column" spacing={1}>
    <ActiveList />
  </Stack>
}
