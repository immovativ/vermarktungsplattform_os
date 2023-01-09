
import { Stack } from '@mui/material';
import React, {FunctionComponent } from 'react';
import { DraftList } from './draft/DraftList';

export const ConceptAssignmentsDraftsPage: FunctionComponent<Record<string, never>> = ({ }) => {
  return <Stack direction="column" spacing={1}>
    <DraftList />
  </Stack>
}
