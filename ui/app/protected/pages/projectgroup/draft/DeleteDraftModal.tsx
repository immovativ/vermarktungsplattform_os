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
import { deleteDraft } from '../queries/concept-assignment';

interface Props {
  cid: string
  onCancel: () => void
  onDeleted: () => void
}

export const DeleteDraftModal: FunctionComponent<Props> = ({
  cid,
  onCancel,
  onDeleted,
}) => {
  const mutation = useBetterMutation( (id: string) => deleteDraft(id),
      {
        onSuccess: onDeleted,
      },
  )

  return <Dialog
    open={true}
    onClose={onCancel}
    aria-label="Entwurf löschen"
  >
    <DialogTitle>
      Entwurf löschen?
    </DialogTitle>
    <DialogContent>
      <Stack direction="column" spacing={1}>
        <Typography variant='body1'>Wollen Sie den Entwurf wirklich löschen?</Typography>
        {mutation.isError && <Alert severity="error" onClose={mutation.reset}>{mutation.error.message}</Alert>}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onCancel}>Abbrechen</Button>
      <LoadingButton
        loading={mutation.isLoading}
        variant="contained"
        onClick={() => mutation.mutate(cid)}
      >
        Löschen
      </LoadingButton>
    </DialogActions>
  </Dialog>
}
