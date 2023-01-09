
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
import { AdminCandidatureView, grantCandidature } from '../queries/candidature';

interface Props {
  d: AdminCandidatureView
  onCancel: () => void
    updateFromMutation: (ca: AdminCandidatureView) => void
}

export const GrantModal: FunctionComponent<Props> = ({
  d,
  onCancel,
  updateFromMutation,
}) => {
  const mutation = useBetterMutation(() => grantCandidature(d.details.candidatureWithAttachments.candidature.id),
      {
        onSuccess: (r) => updateFromMutation(r.data),
      },
  )

  return <Dialog
    open={true}
    onClose={onCancel}
    aria-label="Zuschlag erteilen"
  >
    <DialogTitle>
      Zuschlag erteilen
    </DialogTitle>
    <DialogContent>
      <Stack direction="column" spacing={1}>
        <Typography variant='body1'>Zuschlag erteilen?</Typography>
        <Typography variant='caption'>Alle anderen ungeprüften Bewerbungen werden dann abgelehnt.</Typography>
        {mutation.isError && <Alert severity="error" onClose={mutation.reset}>{mutation.error.message}</Alert>}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onCancel}>Abbrechen</Button>
      <LoadingButton
        loading={mutation.isLoading}
        variant="outlined"
        color='success'
        onClick={mutation.mutate} >
        Zuschlag erteilen
      </LoadingButton>
    </DialogActions>
  </Dialog>
}
