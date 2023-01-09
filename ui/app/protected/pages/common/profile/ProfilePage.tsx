import {Alert, Button, Card, CardActions, CardContent, CircularProgress, Grid, Stack, Typography} from '@mui/material';
import React, {FunctionComponent} from 'react';
import {useQuery} from 'react-query';
import {ChangePasswordModal} from './ChangePasswordModal';
import {ChangePersonalDataModal} from './ChangePersonalDataModal';
import {getProfile, getUserData} from './queries/profile';
import {formatDate, formatDateHuge} from '@common/util/DateFormatter';
import {UserDataForm} from '@protected/pages/common/profile/UserDataForm';
import {getSession} from '@common/navigation/session/Session';
import {UserRole} from '@protected/model/user/UserRole';

export const ProfilePage: FunctionComponent = ({}) => {
  const [changePwOpen, setChangePwOpen] = React.useState(false)
  const [updatePersonalDataOpen, setUpdatePersonalDataOpen] = React.useState<string | null>(null)
  const query = useQuery(['getProfile'], () => getProfile())

  const isCandidate = getSession()?.role === UserRole.CANDIDATE

  const userDataQuery = useQuery(['getUserData'], () => getUserData(), {enabled: !query.isSuccess && isCandidate})

  return (
    <>
      {changePwOpen && <ChangePasswordModal
        onClose={() => {
          setChangePwOpen(false);
          query.refetch()
        }}
      />}
      {updatePersonalDataOpen && <ChangePersonalDataModal
        onClose={() => {
          setUpdatePersonalDataOpen(null);
          query.refetch()
        }}
        currentName={updatePersonalDataOpen}
      />}
      <Grid container spacing={1}>
        <Grid item md={12} lg={6}>
          <Card sx={{height: '100%'}}>
            <CardContent>
              <Stack direction="column" spacing={1}>
                <Typography gutterBottom variant="h5" component="div">
                  Stammdaten
                </Typography>
                {query.isLoading ? <CircularProgress/> : query.data && (<>
                  <Typography variant="body1">
                    {query.data.name} <small>&lt;{query.data.email}&gt;</small>
                  </Typography>
                </>)}
                {query.isError && <Alert severity="error">Ihre Stammdaten konnten nicht geladen werden.</Alert>}
              </Stack>
            </CardContent>
            <CardActions>
              <Button onClick={() =>
                setUpdatePersonalDataOpen(query.data?.name || null)} size="small">Stammdaten ändern</Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item md={12} lg={6}>
          <Card sx={{height: '100%'}}>
            <CardContent>
              <Stack direction="column" spacing={1}>
                <Typography gutterBottom variant="h5" component="div">
                  Sicherheit
                </Typography>
                {query.isLoading ? <CircularProgress/> : query.data && (<>
                  {query.data.lastLogin && <Typography variant="body2">
                    Letzter Login: {formatDateHuge(query.data.lastLogin)}
                  </Typography>}
                  <Typography variant="body2">
                    Letzte Aktualisierung: {formatDate(query.data.lastModified)}
                  </Typography>
                </>)}
                {query.isError && <Alert severity="error">Ihre Stammdaten konnten nicht geladen werden.</Alert>}
              </Stack>
            </CardContent>
            <CardActions>
              <Button onClick={() => setChangePwOpen(true)} size="small">Passwort ändern</Button>
            </CardActions>
          </Card>
        </Grid>

        {isCandidate &&
          <Grid item xs={12}>
            <Stack direction="column" spacing={1}>
              {userDataQuery.data && <UserDataForm userData={userDataQuery.data} onChange={userDataQuery.refetch}/>}
              {userDataQuery.isLoading && <CircularProgress/>}
              {userDataQuery.isError &&
                <Alert severity="error">Ihre Benutzerdaten konnten nicht geladen werden.</Alert>}
            </Stack>
          </Grid>
        }
      </Grid>
    </>
  )
}
