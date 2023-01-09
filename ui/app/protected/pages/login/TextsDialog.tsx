import React, {FunctionComponent} from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack} from '@mui/material';
import TextPage from '@public/pages/TextPage';

interface Props {
  onClose: () => void
}

export const TextsDialog: FunctionComponent<Props> = (props) => {
  return <Dialog
    open={true}
    onClose={props.onClose}
    fullWidth={true}
    maxWidth="md"
  >
    <DialogTitle>
      Nutzungs- und Datenschutzbestimmungen
    </DialogTitle>
    <DialogContent>
      <Stack direction="column" spacing={2}>
        <TextPage textName="termsAndConditions" title="AGB"/>
        <TextPage textName="privacyPolicy" title="Datenschutz"/>
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={props.onClose}>Schliessen</Button>
    </DialogActions>
  </Dialog>
}
