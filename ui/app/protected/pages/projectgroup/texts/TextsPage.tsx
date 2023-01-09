import React, {FunctionComponent} from 'react';
import {Stack} from '@mui/material';
import {EditorWrapper} from '@protected/pages/common/EditorWrapper';

export const TextsPage: FunctionComponent = () => {
  return (
    <Stack direction="column">
      <EditorWrapper textName="imprint" title="Impressum" />
      <EditorWrapper textName="privacyPolicy" title="Datenschutz" />
      <EditorWrapper textName="termsAndConditions" title="AGB" />
    </Stack>
  )
}
