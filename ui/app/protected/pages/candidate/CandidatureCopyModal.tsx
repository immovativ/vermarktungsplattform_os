import React, {FunctionComponent} from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, FormGroup, MenuItem,
  Select, Stack,
} from '@mui/material';
import {useQuery} from 'react-query';
import {copyCandidatureValues, listCandidatures} from '@protected/pages/candidate/queries';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {LoadingButton} from '@common/component/LoadingButton';

interface Props {
  candidatureId: string
  onSuccess: () => void
  onClose: () => void
}

export const CandidatureCopyModal: FunctionComponent<Props> = (props) => {
  const query = useQuery(['listCandidatures'], () => listCandidatures())

  const candidatures = query.data?.filter((c) => c.id !== props.candidatureId)

  const [candidatureId, setCandidatureId] = React.useState<string | undefined>(undefined)

  const copyMutation = useBetterMutation(
      (candidatureId: string) => copyCandidatureValues(candidatureId, props.candidatureId),
      {
        onSuccess: () => {
          props.onSuccess()
        },
      })

  return <Dialog
    open={true}
    fullWidth
    maxWidth="md"
    aria-label="Werte kopieren Dialog"
    onClose={props.onClose}
  >
    <DialogTitle>Werte (Beschreibung + Anhänge) aus anderer Bewerbung übernehmen?</DialogTitle>
    <DialogContent>
      <Stack direction="column" spacing={1}>
        {candidatures && candidatures.length > 0 ?
          <FormGroup>
            <Select value={candidatureId || ''} onChange={(e) => setCandidatureId(e.target.value)}>
              {candidatures.map((candidature) =>
                <MenuItem key={candidature.id} value={candidature.id}>{candidature.conceptDetails.name}</MenuItem>,
              )}
            </Select>
          </FormGroup> :
          <Alert severity="info">Keine Bewerbungen gefunden.</Alert>
        }

        {query.isLoading ? <CircularProgress/> : null}
        {query.isError ? <Alert severity="error">Fehler beim Laden der Daten.</Alert> : null}
        {copyMutation.isError ?
          <Alert severity="error">Fehler beim Kopieren: {copyMutation.error.message}</Alert> : null}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={props.onClose}>
        Abbrechen
      </Button>
      <LoadingButton
        disabled={!candidatureId}
        variant="contained"
        onClick={() => candidatureId && copyMutation.mutate(candidatureId)}
      >
        Werte übernehmen
      </LoadingButton>
    </DialogActions>
  </Dialog>
}
