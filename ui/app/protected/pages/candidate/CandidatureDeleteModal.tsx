import React, {FunctionComponent} from 'react';
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle} from '@mui/material';

interface Props {
  onSuccess: () => void
  onClose: () => void
}

export const CandidatureDeleteModal: FunctionComponent<Props> = (props) => {
  return <Dialog
    open={true}
    fullWidth
    maxWidth="xs"
    aria-label="Bewerbung löschen Dialog"
    onClose={props.onClose}
  >
    <DialogTitle>Bewerbung löschen?</DialogTitle>
    <DialogContent>
      <Alert severity="error">
        Wollen Sie die Bewerbung löschen?<br/>
        Alle Ihre Eingaben gehen damit unwiderruflich verloren!
      </Alert>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={props.onClose}>
        Abbrechen
      </Button>
      <Button variant="contained" onClick={props.onSuccess}>
        Bewerbung löschen
      </Button>
    </DialogActions>
  </Dialog>
}
