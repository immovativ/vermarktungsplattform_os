

import { useBetterMutation } from '@common/hooks/useBetterMutationHook';
import { useProvideBreadcrumb } from '@common/navigation/breadcrumb/useBreadcrumb';
import { formatDate } from '@common/util/DateFormatter';
import {
  Alert, Button, Card, CardActions, CardContent, CardHeader, CircularProgress, Divider, Grid, List, ListItem,
  ListItemAvatar, ListItemButton, ListItemText, Stack, Tooltip, Typography,
} from '@mui/material';
import { UserStatus } from '@protected/model/user/UserStatus';
import { SalutationTranslations } from '@protected/pages/common/profile/queries/profile';
import axios from 'axios';
import React, {FC, FunctionComponent} from 'react';
import { useQuery } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getProfileAsAdmin, UserData } from '../queries/candidature';
import { BuildingTypeTranslations } from '../queries/concept-assignment';
import { candidatureAvatar, candidatureTitle } from './CandidateProfile';
import { getUsername } from './CandidatureDetail';
import { avatar } from './CandidaturesList';


export const UserDataDisplay: FC<{user: UserData, email?: string}> = ({user, email}) => {
  return ( <>
    <Typography variant='body1'>{avatar(user.accountType)}
      &nbsp;{user.accountType === 'COMPANY' ? 'Gewerbliches Konto' : 'Privates Konto'}</Typography>
    <Divider variant='middle' sx={{mt: 1, mb: 1}} />
    <Typography variant='caption'>{SalutationTranslations[user.salutation]}</Typography>
    <Typography variant='body1'>{user.firstName} {user.lastName}</Typography>
    {user.company && <Typography variant='body1'>Firma {user.company}</Typography>}
    <Typography variant='body2'>{user.street} {user.houseNumber} </Typography>
    <Typography variant='body2'>{user.zipCode} {user.city} </Typography>
    <Divider variant='middle' sx={{mt: 1, mb: 1}} />
    <Typography variant='caption'>Kontakt</Typography>
    {email && <Typography variant='body2'>
      {<a href={`mailto:${email}`} target='_blank' rel="noreferrer">{email}</a>}
    </Typography>}
    <Typography variant='body2'>
      {<a href={`tel:${user.phoneNumber}`}>{user.phoneNumber}</a>}
    </Typography>
  </>)
}

export const StandaloneProfilePage: FunctionComponent = ({
}) => {
  const params = useParams()
  const userId = params.uid
  const navigate = useNavigate()

  const query = useQuery(['loadProfileAsAdmin', userId], () => getProfileAsAdmin(userId as string), { enabled: !!userId })
  const activateDelegateMutation = useBetterMutation<void, void, void>(() => axios.post(`/api/admin/user/${userId}/activate-delegate`), {
    onSuccess: query.refetch,
  })

  useProvideBreadcrumb(
      'profile-name',
      {name: `Bewerbung ${getUsername(query.data?.userData)}`},
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
            <UserDataDisplay
              user={u}
              email={query.data.email}
            />
            <br/>
            { u.userStatus === UserStatus.DELEGATED && <Card variant='outlined'>
              <CardContent>
                Diese Nutzer:in wurde manuell erfasst und hat keinen Zugang zur Platform.
                Laden Sie sie ein um ihr E-Mail mit der Anleitung zum Einrichten eines Kontos zu schicken.
              </CardContent>
              <CardActions>
                <Button onClick={() => activateDelegateMutation.mutate()}>Erfasste Nutzer:in einladen</Button>
              </CardActions>
            </Card>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader title='Bewerbungen' />
          <CardContent>
            {query.data.candidatures.length === 0 && <Alert severity='info' variant='outlined'>Es wurden bisher keine Bewerbungen eingereicht.</Alert>}
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
