import { formatDate } from '@common/util/DateFormatter';
import { Close } from '@mui/icons-material';
import {
  Chip,
  Dialog,
  DialogContent,
  DialogTitle, Grid, IconButton, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, Stack, Tooltip,
} from '@mui/material';
import { CandidatureState } from '@protected/model/candidature/Candidature';
import React, {FunctionComponent} from 'react';
import { useNavigate } from 'react-router-dom';
import { CandidateListResultCandidature } from '../queries/candidature';
import { BuildingTypeTranslations, ConceptAssignmentState } from '../queries/concept-assignment';

export function chipForStates(candidature: CandidatureState, concept: ConceptAssignmentState): JSX.Element | null {
  if (concept === 'ACTIVE') return <Chip label='Verfahren aktiv' color='info' variant='outlined' />
  switch (candidature) {
    case 'SUBMITTED': return <Chip label='Bewerbung in Prüfung' color='info' variant='outlined' />
    case 'DRAFT': return null
    case 'REJECTED': return <Chip label='Bewerbung Abgelehnt' color='error' />
    case 'ACCEPTED': return <Chip label='Zuschlag erteilt' color='success' />
  }
}

interface Props {
  candidatures: readonly CandidateListResultCandidature[]
  name: string
  onCancel: () => void
}

export const CandidateCandidaturesModal: FunctionComponent<Props> = ({
  candidatures,
  onCancel,
  name,
}) => {
  const navigate = useNavigate()
  return <Dialog
    open={true}
    onClose={onCancel}
    maxWidth='md'
    fullWidth
    aria-label="Bewerbungen"
  >

    <DialogTitle style={{textAlign: 'center'}}>
      {candidatures.length} Bewerbung{candidatures.length === 1 ? '' : 'en'} von {name}
      <Tooltip title="Schliessen">
        <IconButton
          aria-label="close"
          onClick={onCancel}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
      </Tooltip>
    </DialogTitle>
    <DialogContent>
      <Stack direction="column" spacing={1}>
        <Grid container>
          <List>
            {candidatures.map((c) => <ListItem key={`candidature-${c.candidatureId}`}>
              <ListItemButton onClick={() => navigate(`/protected/admin/conceptAssignments/${c.conceptId}/candidature/${c.candidatureId}`)}>
                <ListItemText sx={{mr: 4}}
                  primary={`${c.conceptName} (${BuildingTypeTranslations[c.buildingType]})`}
                  secondary={`Eingereicht: ${formatDate(c.updatedAt)}`}
                />
                <ListItemAvatar>{chipForStates(c.candidatureState, c.conceptState)}&nbsp;</ListItemAvatar>
              </ListItemButton>
            </ListItem>,
            )}
          </List>
        </Grid>
      </Stack>
    </DialogContent>
  </Dialog>
}
