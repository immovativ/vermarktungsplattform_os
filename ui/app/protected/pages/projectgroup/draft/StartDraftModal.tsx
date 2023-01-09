import {LoadingButton} from '@common/component/LoadingButton';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {
  Alert,
  Button, Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, Divider, FormControlLabel, Stack, TextField,
} from '@mui/material';
import React, {FunctionComponent, useState} from 'react';
import {DateTimePicker, LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterLuxon} from '@mui/x-date-pickers/AdapterLuxon';
import { AdminConceptAssignmentDetailWithAttachments, start } from '../queries/concept-assignment';

interface Props {
  cid: string
  onClose: () => void
  onSuccess: (ca: AdminConceptAssignmentDetailWithAttachments) => void
}

export const StartDraftModal: FunctionComponent<Props> = ({
  cid,
  onClose,
  onSuccess,
}) => {
  const [startImmediate, setStartImmediate] = useState<boolean>(false)
  const [startsAt, setStartsAt] = useState<Date | null>(null)
  const [endsAt, setEndsAt] = useState<Date | null>(null)

  const mutation = useBetterMutation(
      (p: {startsAt: Date, endsAt: Date}) => start(cid, p),
      {
        onSuccess: (r) => {
          onSuccess(r.data)
        },
      },
  )

  const illegalInput = startsAt && endsAt && startsAt >= endsAt

  return <Dialog
    open={true}
    onClose={onClose}
    aria-label="Vergabe starten"
  >
    <DialogTitle>
      Vergabe starten
    </DialogTitle>
    <DialogContent>
      <LocalizationProvider dateAdapter={AdapterLuxon} locale="de">
        <Stack direction="column" spacing={2}>
          <FormControlLabel
            control={
              <Checkbox
                onChange={(e) => {
                  setStartsAt(new Date())
                  setStartImmediate(e.target.checked)
                }}
              />
            }
            label="Vergabe sofort veröffentlichen"
          />
          {!startImmediate &&
                <DateTimePicker
                  onChange={setStartsAt}
                  value={startsAt}
                  disablePast
                  label="Veröffentlichungsdatum"
                  disableMaskedInput
                  renderInput={(props) => <TextField {...props} autoComplete="off" />}
                />
          }
          <Divider variant='fullWidth' />
          <DateTimePicker
            onChange={setEndsAt}
            value={endsAt}
            disablePast
            label="Ende der Bewerbungsfrist"
            disableMaskedInput
            renderInput={(props) => <TextField {...props} autoComplete="off" />}
          />
          {illegalInput && <Alert severity="error">Das Veröffentlichungsdatum muss <strong>vor</strong> dem Ende der Bewerbungsfrist sein.</Alert>}
          {mutation.isError && <Alert severity="error" onClose={mutation.reset}>{mutation.error.message}</Alert>}
        </Stack>
      </LocalizationProvider>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onClose}>Abbrechen</Button>
      <LoadingButton
        loading={mutation.isLoading}
        disabled={illegalInput || startsAt === null || endsAt === null}
        variant="contained"
        onClick={() => startsAt !== null && endsAt !== null && mutation.mutate({startsAt, endsAt})}
      >
        Speichern
      </LoadingButton>
    </DialogActions>
  </Dialog>
}
