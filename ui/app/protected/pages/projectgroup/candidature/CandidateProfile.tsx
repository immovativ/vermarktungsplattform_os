
import { formatDate } from '@common/util/DateFormatter';
import { QuestionMark, ThumbDown, ThumbUp } from '@mui/icons-material';
import { Alert, Card, CardContent, CardHeader, CircularProgress, Divider, Grid, List, ListItem,
  ListItemAvatar, ListItemButton, ListItemText, Stack, Tooltip, Typography } from '@mui/material';
import { CandidatureState } from '@protected/model/candidature/Candidature';
import { useProvideBreadcrumb } from '@common/navigation/breadcrumb/useBreadcrumb';
import React, {FunctionComponent} from 'react';
import { useQuery } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getProfileAsAdmin } from '../queries/candidature';
import { BuildingTypeTranslations } from '../queries/concept-assignment';
import { getUsername } from './CandidatureDetail';
import {SalutationTranslations} from '@protected/pages/common/profile/queries/profile';
import { avatar } from './CandidaturesList';

export function candidatureTitle(state: CandidatureState): string {
  switch (state) {
    case 'REJECTED':
      return 'Abgelehnte Bewerbung'
    case 'ACCEPTED':
      return 'Akzeptierte Bewerbung'
    default:
      return 'Bewerbung ist in Prüfung'
  }
}

export function candidatureAvatar(state: CandidatureState): React.ReactElement | null {
  switch (state) {
    case 'REJECTED':
      return <ThumbDown color='error' />
    case 'ACCEPTED':
      return <ThumbUp color='success' />
    case 'SUBMITTED':
      return <QuestionMark />
    default: return null
  }
}

export const CandidateProfile: FunctionComponent = ({
}) => {
  const params = useParams()
  const candidatureId = params.cid
  const userId = params.uid
  const navigate = useNavigate()

  const query = useQuery(['loadProfileAsAdmin', userId], () => getProfileAsAdmin(userId as string), { enabled: !!userId })

  useProvideBreadcrumb(
      'assignment-name',
      {name: query.data?.candidatures?.find((c) => c.id === candidatureId)?.conceptName || 'Vergabeverfahren'},
  )

  useProvideBreadcrumb(
      'candidature-name',
      {name: `Bewerbung ${getUsername(query.data?.userData)}`},
  )

  useProvideBreadcrumb(
      'profile-name',
      {name: 'Profil'},
  )

  if (query.isLoading) {
    return <CircularProgress />
  } else if (query.isError) {
    return <Alert severity='error' variant='outlined'>Das Profil konnte nicht geladen werden. Bitte versuchen Sie es erneut.</Alert>
  } else if (query.data) {
    const u = query.data.userData
    return <Stack direction="column" spacing={2} sx={{pb: 6}}>
      <Grid display='grid' gridTemplateColumns='1fr 1fr' columnGap={1}>
        <Card>
          <CardHeader title='Kontaktdaten Bewerber:in'>
          </CardHeader>
          <CardContent>

            <Typography variant='body1'>{avatar(u.accountType)}
              &nbsp;{u.accountType === 'COMPANY' ? 'Gewerbliches Konto' : 'Privates Konto'}</Typography>
            <Divider variant='middle' sx={{mt: 1, mb: 1}} />
            <Typography variant='caption'>{SalutationTranslations[u.salutation]}</Typography>
            <Typography variant='body1'>{u.firstName} {u.lastName}</Typography>
            {u.company && <Typography variant='body1'>Firma {u.company}</Typography>}
            <Typography variant='body2'>{u.street} {u.houseNumber} </Typography>
            <Typography variant='body2'>{u.zipCode} {u.city} </Typography>
            <Divider variant='middle' sx={{mt: 1, mb: 1}} />
            <Typography variant='caption'>Kontakt</Typography>
            <Typography variant='body2'>
              {<a href={`mailto:${query.data.email}`} target='_blank' rel="noreferrer">{query.data.email}</a>}
            </Typography>
            <Typography variant='body2'>
              {<a href={`tel:${u.phoneNumber}`}>{u.phoneNumber}</a>}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title='Bewerbungen' />
          <CardContent>
            <List>
              {query.data.candidatures.map((c) => <ListItem key={`candidature-${c.id}`}>
                <Tooltip title={candidatureTitle(c.state)} placement='left' arrow>
                  <ListItemButton onClick={() => navigate(`/protected/admin/conceptAssignments/${
                    c.conceptId
                  }/candidature/${c.id}`)}>
                    <ListItemAvatar>{candidatureAvatar(c.state)}</ListItemAvatar>
                    <ListItemText
                      primary={c.conceptName}
                      secondary={`${BuildingTypeTranslations[c.buildingType]} - ${formatDate(c.updatedAt)}`}
                    />
                  </ListItemButton></Tooltip>
              </ListItem>)}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Stack>
  } else {
    return <CircularProgress />
  }
}
