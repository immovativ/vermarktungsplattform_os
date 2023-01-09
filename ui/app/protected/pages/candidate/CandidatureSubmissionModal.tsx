import React, {FunctionComponent} from 'react';
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle} from '@mui/material';

interface Props {
  onSuccess: () => void
  onClose: () => void
  state: string | undefined
}

export const CandidatureSubmissionModal: FunctionComponent<Props> = (props) => {
  return <Dialog
    open={true}
    fullWidth
    maxWidth="xs"
    aria-label="Bewerbung einreichen Dialog"
    onClose={props.onClose}
  >
    <DialogTitle>Bewerbung einreichen?</DialogTitle>
    <DialogContent>
      {props.state === 'ACTIVE' ?
       <Alert severity="info">
        Wollen Sie die Bewerbung einreichen?<br/>
        Sie können die Bewerbung danach nicht mehr ändern.
       </Alert> :
      <Alert severity="info">
        Die Bewerbungsfrist ist abgelaufen!<br/>
        Sie können diese Bewerbung nicht mehr einreichen
      </Alert>
      }
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={props.onClose}>
        Abbrechen
      </Button>
      {props.state === 'ACTIVE' &&
      <Button variant="contained" onClick={props.onSuccess}>
        Bewerbung einreichen
      </Button>
      }
    </DialogActions>
  </Dialog>
}
