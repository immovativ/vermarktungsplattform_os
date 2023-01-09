import React, {FunctionComponent} from 'react';
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle} from '@mui/material';

interface Props {
  onSuccess: () => void
  onClose: () => void
}

export const CandidatureRevokeModal: FunctionComponent<Props> = (props) => {
  return <Dialog
    open={true}
    fullWidth
    maxWidth="xs"
    aria-label="Bewerbung zurückziehen Dialog"
    onClose={props.onClose}
  >
    <DialogTitle>Bewerbung zurückziehen?</DialogTitle>
    <DialogContent>
      <Alert severity="info">
        Wollen Sie die Bewerbung wirklich zurückziehen?
        <br/>
        Solange die Bewerbungsfrist noch nicht erreicht ist, können Sie Ihre Bewerbung jederzeit bearbeiten und erneut einreichen.
        <br/>
        Ist die Bewerbungsfrist bereits beendet, so können Sie die Bewerbung nicht erneut einreichen.
      </Alert>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={props.onClose}>
        Abbrechen
      </Button>
      <Button variant="contained" onClick={props.onSuccess}>
        Bewerbung zurückziehen
      </Button>
    </DialogActions>
  </Dialog>
}
