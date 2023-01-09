import {LoadingButton} from '@common/component/LoadingButton';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, Stack, Typography,
} from '@mui/material';
import React, {FunctionComponent} from 'react';
import { AdminCandidatureView, rejectCandidature } from '../queries/candidature';

interface Props {
  d: AdminCandidatureView
  onCancel: () => void
    updateFromMutation: (ca: AdminCandidatureView) => void
}

export const RejectModal: FunctionComponent<Props> = ({
  d,
  onCancel,
  updateFromMutation,
}) => {
  const mutation = useBetterMutation(() => rejectCandidature(d.details.candidatureWithAttachments.candidature.id),
      {
        onSuccess: (r) => updateFromMutation(r.data),
      },
  )

  return <Dialog
    open={true}
    onClose={onCancel}
    aria-label="Bewerbung ablehnen"
  >
    <DialogTitle>
      Bewerbung ablehnen
    </DialogTitle>
    <DialogContent>
      <Stack direction="column" spacing={1}>
        <Typography variant='body1'>Bewerbung ablehnen?</Typography>
        {mutation.isError && <Alert severity="error" onClose={mutation.reset}>{mutation.error.message}</Alert>}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onCancel}>Abbrechen</Button>
      <LoadingButton
        loading={mutation.isLoading}
        variant="outlined"
        color='error'
        onClick={mutation.mutate} >
        Ablehnen
      </LoadingButton>
    </DialogActions>
  </Dialog>
}
