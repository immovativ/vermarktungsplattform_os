import {LoadingButton} from '@common/component/LoadingButton';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import { formatDate } from '@common/util/DateFormatter';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, Stack, Typography,
} from '@mui/material';
import React, {FunctionComponent} from 'react';
import { AdminConceptAssignmentDetail, AdminConceptAssignmentDetailWithAttachments, unstart } from '../queries/concept-assignment';

interface Props {
  a: AdminConceptAssignmentDetail
  onCancel: () => void
    updateFromMutation: (ca: AdminConceptAssignmentDetailWithAttachments) => void
}

export const UnstartModal: FunctionComponent<Props> = ({
  a,
  onCancel,
  updateFromMutation,
}) => {
  const mutation = useBetterMutation( (id: string) => unstart(id),
      {
        onSuccess: (r) => updateFromMutation(r.data),
      },
  )

  return <Dialog
    open={true}
    onClose={onCancel}
    aria-label="Vergabe abbrechen"
  >
    <DialogTitle>
      Vergabe abbrechen
    </DialogTitle>
    <DialogContent>
      <Stack direction="column" spacing={1}>
        <Typography variant='body1'>Wollen Sie die Vergabe {a.name} wirklich abbrechen?</Typography>
        <Typography variant='body2'>Statt am {a.assignmentStart && formatDate(a.assignmentStart)} öffentlich zu werden wird die Vergabe wieder
         zu den Entwürfen verschoben.</Typography>
        {mutation.isError && <Alert severity="error" onClose={mutation.reset}>{mutation.error.message}</Alert>}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onCancel}>Vergabe nicht abbrechen</Button>
      <LoadingButton
        loading={mutation.isLoading}
        variant="contained"
        onClick={() => mutation.mutate(a.id)}
      >
        Vergabe abbrechen
      </LoadingButton>
    </DialogActions>
  </Dialog>
}
