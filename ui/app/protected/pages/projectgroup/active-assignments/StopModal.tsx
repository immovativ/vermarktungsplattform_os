
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
import { AdminConceptAssignmentDetail, AdminConceptAssignmentDetailWithAttachments, stopManually } from '../queries/concept-assignment';

interface Props {
  a: AdminConceptAssignmentDetail
  onCancel: () => void
    updateFromMutation: (ca: AdminConceptAssignmentDetailWithAttachments) => void
}

export const StopModal: FunctionComponent<Props> = ({
  a,
  onCancel,
  updateFromMutation,
}) => {
  const mutation = useBetterMutation( (id: string) => stopManually(id),
      {
        onSuccess: (r) => updateFromMutation(r.data),
      },
  )

  return <Dialog
    open={true}
    onClose={onCancel}
    aria-label="Vergabe vorzeitig beenden"
  >
    <DialogTitle>
      Vergabe vorzeitig beenden
    </DialogTitle>
    <DialogContent>
      <Stack direction="column" spacing={1}>
        <Typography variant='body1'>Nur für Entwickler!</Typography>
        {mutation.isError && <Alert severity="error" onClose={mutation.reset}>{mutation.error.message}</Alert>}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onCancel}>Abbrechen</Button>
      <LoadingButton
        loading={mutation.isLoading}
        variant="contained"
        onClick={() => mutation.mutate(a.id)}
      >
        Frist vorzeitig beenden
      </LoadingButton>
    </DialogActions>
  </Dialog>
}
