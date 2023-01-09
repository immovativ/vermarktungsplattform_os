import { Stack } from '@mui/material';
import React, {FunctionComponent } from 'react';
import { ReviewList } from './ReviewList';

export const ReviewPage: FunctionComponent<Record<string, never>> = ({ }) => {
  return <Stack direction="column" spacing={1}>
    <ReviewList />
  </Stack>
}
