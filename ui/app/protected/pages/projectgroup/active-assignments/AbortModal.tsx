import {LoadingButton} from '@common/component/LoadingButton';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, Typography,
} from '@mui/material';
import React, {FunctionComponent} from 'react';
import { useNavigate } from 'react-router-dom';
import { abortAndDraft, AdminConceptAssignmentDetailWithAttachments, justAbort } from '../queries/concept-assignment';

interface Props {
  a: AdminConceptAssignmentDetailWithAttachments
  onCancel: () => void
    updateFromMutation: (ca: AdminConceptAssignmentDetailWithAttachments) => void
}

export const AbortModal: FunctionComponent<Props> = ({
  a,
  onCancel,
  updateFromMutation,
}) => {
  const [mode, setMode] = React.useState<'abort' | 'abortAndDraft'>('abortAndDraft')
  const navigate = useNavigate()
  const mutation = useBetterMutation( (p: {id: string, mode: 'abort' | 'abortAndDraft'}) => mode === 'abort' ? justAbort(p.id) : abortAndDraft(p.id),
      {
        onSuccess: (r) => {
          if ((r.data as AdminConceptAssignmentDetailWithAttachments).assignment.state === 'DRAFT') {
            navigate(`/protected/admin/conceptAssignments/${r.data.assignment.id}`)
          } else {
            updateFromMutation(r.data)
          }
        },
      },
  )

  return <Dialog
    open={true}
    maxWidth='md'
    fullWidth
    onClose={onCancel}
    aria-label="Vergabe abbrechen"
  >
    <DialogTitle>
      Vergabe abbrechen
    </DialogTitle>
    <DialogContent>
      <Stack direction="column" spacing={1}>
        <Typography variant='body1'>Wie wollen Sie die Vergabe abbrechen?</Typography>
        <FormControl fullWidth>
          <InputLabel id="abort-mode">Modus</InputLabel>
          <Select
            labelId="abort-mode"
            value={mode}
            label="Modus"
            onChange={(e) => setMode(e.target.value as 'abort' | 'abortAndDraft')}
          >
            <MenuItem value={'abort'}>Vergabe abbrechen und archivieren</MenuItem>
            <MenuItem value={'abortAndDraft'}>Vergabe abbrechen und archivieren und als neuer Entwurf übernehmen</MenuItem>
          </Select>
        </FormControl>
        {mode === 'abortAndDraft' && <Typography variant='caption'>
            Mit dieser Option werden alle offenen Bewerbungen der Vergabe abgelehnt.<br/>
            Es wird ein neuer Vergabe-Entwurf mit denselben Daten erstellt. Die Anhänge und Fragen werden mit übernommen.
        </Typography>}
        {mode === 'abort' && <Typography variant='caption'>
            Mit dieser Option werden alle offenen Bewerbungen der Vergabe abgelehnt.<br/>
            Die Vergabe wird archiviert und kann dann nicht mehr veröffentlicht werden.
        </Typography>}
        {mutation.isError && <Alert severity="error" onClose={mutation.reset}>{mutation.error.message}</Alert>}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onCancel}>Abbrechen</Button>
      <LoadingButton
        loading={mutation.isLoading}
        variant="contained"
        onClick={() => mutation.mutate({id: a.assignment.id, mode: mode})}
      >
        Vergabe abbrechen
      </LoadingButton>
    </DialogActions>
  </Dialog>
}
