
import { formatDate } from '@common/util/DateFormatter';
import { Business, Person } from '@mui/icons-material';
import { Alert, Chip, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, Stack, Typography } from '@mui/material';
import { CandidatureStateTranslations } from '@protected/model/candidature/Candidature';
import { UserStatus, UserStatusTranslation } from '@protected/model/user/UserStatus';
import { UserAccountType } from '@protected/pages/common/profile/queries/profile';
import React, { FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CandidatureWithUser } from '../queries/concept-assignment';

interface Props {
    candidatures: readonly CandidatureWithUser[]
}

export function avatar(t: UserAccountType): React.ReactElement {
  switch (t) {
    case 'PERSONAL': return <Person />
    case 'COMPANY': return <Business />
  }
}

function candidatureLink(c: CandidatureWithUser): string {
  if (c.user.userStatus == UserStatus.DELEGATED && c.candidature.state != 'SUBMITTED') {
    return `candidature/${c.candidature.id}/edit`
  } else {
    return `candidature/${c.candidature.id}`
  }
}

export const CandidaturesList: FunctionComponent<Props> = ({
  candidatures,
}) => {
  const navigate = useNavigate()

  return <Stack direction="column">
    {candidatures.length === 0 && <Alert severity='info' variant='outlined'>Bisher wurden keine Bewerbungen eingereicht.</Alert>}
    <List>
      {candidatures.map((c) => <ListItem key={`candidature-${c.candidature.id}`}>
        <ListItemButton onClick={() => navigate(candidatureLink(c))}>
          <ListItemAvatar>{avatar(c.user.accountType)}</ListItemAvatar>
          <ListItemText
            primary={
              <Stack direction="row" spacing={1}>
                <Typography>
                  {c.user.company || `${c.user.firstName} ${c.user.lastName}`}
                </Typography>
                {c.user.userStatus === UserStatus.DELEGATED && <Stack direction="row" spacing={0.5}>
                  <Chip label={UserStatusTranslation.DELEGATED} size="small" />
                  <Chip label={`Status: ${CandidatureStateTranslations[c.candidature.state]}`} size="small" />
                </Stack>}
              </Stack>
            }
            secondary={`Eingegangen ${formatDate(c.candidature.updatedAt)}`}
          />
        </ListItemButton>
      </ListItem>,
      )}
    </List>

  </Stack>
}
