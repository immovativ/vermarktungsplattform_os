import React, {FunctionComponent} from 'react';
import {Stack} from '@mui/material';
import {EditorWrapper} from '@protected/pages/common/EditorWrapper';

export const BaurechtTextsPage: FunctionComponent = () => {
  return (
    <Stack direction="column">
      <EditorWrapper textName="baurecht" title="Baurecht" />
    </Stack>
  )
}
