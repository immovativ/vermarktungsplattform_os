import { Alert, CircularProgress, Grid, List, ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText, Paper, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import React, {FunctionComponent } from 'react';
import { useQuery } from 'react-query';

import { ChatBoxCaller } from './MessageEntry';
import { getUnread } from '@common/queries/messaging';

import _ from 'lodash';
import { ChatBox } from './ChatBox';
import { useNavigate } from 'react-router-dom';
import { useProvideBreadcrumb } from '@common/navigation/breadcrumb/useBreadcrumb';
import { chipForStates } from '@protected/pages/projectgroup/candidature/CandidateCandidaturesModal';

interface Props {
    for: ChatBoxCaller
}

export const UnreadPage: FunctionComponent<Props> = (props) => {
  // do not share cache key with menu unread to avoid dismounts that break the open chat box
  const query = useQuery(['messaging.unread.notifications', props.for], () => getUnread(props.for), {
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    refetchOnMount: true,
  })

  useProvideBreadcrumb(
      'messaging',
      {name: 'Meine Nachrichten'},
  )
  const navigate = useNavigate()
  const groupedData = query.data?.data && _.groupBy(query.data.data, 'candidatureId')

  return <Stack direction="column" spacing={1}>
    <Grid item component={Paper} sx={{pb: 2, pl: 2, pr: 2}}>
      <Toolbar sx={{pl: {sm: 2}, pr: {xs: 1}}}>
        <Typography align="left" sx={{flex: '1 1 100%'}} variant="h6"
          component="div">Ungelesene Nachrichten</Typography>
      </Toolbar>
      {query.isLoading && <CircularProgress />}
      {query.isError && <Alert severity='error'>Fehler beim Laden der Nachrichten. Bitte versuchen Sie es erneut.</Alert>}
      {query.isSuccess && groupedData && Object.keys(groupedData).length === 0 && <Alert variant='outlined' severity='info'>
        Keine ungelesenen Nachrichten vorhanden.
      Sie können über die Bewerbungsseite Nachrichten an die {props.for === 'admin' ? 'Bewerber:innen' : 'Projektgruppe Dietenbach'} schicken.</Alert>}
      {query.isSuccess && groupedData && <Grid container>
        <List>
          {Object.keys(groupedData).map((candidatureId) => {
            const all = groupedData[candidatureId]
            const one = all[0]
            const from = props.for === 'admin' ? `${one.userFirstName} ${one.userLastName}` : 'Projektgruppe Dietenbach'
            const navigationLink = props.for === 'admin' ? `/protected/admin/conceptAssignments/${one.conceptId}/candidature/${candidatureId}` :
            `/protected/candidate/candidatures/${candidatureId}`
            return <ListItem key={candidatureId} secondaryAction={
              <ChatBox candidatureId={candidatureId} for={props.for} displayName={`${one.userFirstName} ${one.userLastName}`} />
            }>
              <ListItemAvatar>{chipForStates(one.candidatureState, one.conceptState)}&nbsp;</ListItemAvatar>
              <Tooltip title='Zur Bewerbung' arrow placement='left'>
                <ListItemButton onClick={() => navigate(navigationLink)}>
                  <ListItemText sx={{mr: 4}}
                    primary={`Vergabe ${one.conceptName}`}
                    secondary={from}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          })}
        </List>
      </Grid>}
    </Grid>
  </Stack>
}
