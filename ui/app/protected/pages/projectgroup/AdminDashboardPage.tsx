import { Alert, Card, CardContent, CardHeader, CircularProgress, Grid, Link, Stack, Typography } from '@mui/material';
import React, {FunctionComponent } from 'react';
import { useQuery } from 'react-query';
import { BrandLine } from '../common/BrandLine';
import { betterToHuman } from './active-assignments/ActiveList';
import { getAdminDashboard } from './queries/dashboard';
import {DateTime} from 'luxon';
import { getUnread } from '@common/queries/messaging';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';

export const AdminDashboardPage: FunctionComponent<Record<string, never>> = ({ }) => {
  // this already gets refreshed by MenuMessageText.tsx (shared cache key)
  const unreadQuery = useQuery(['messaging.unread', 'admin'], () => getUnread('admin'), {refetchInterval: false,
    refetchOnMount: true, refetchOnWindowFocus: false, refetchOnReconnect: false})
  const query = useQuery(['adminDashboard'], () => getAdminDashboard())
  const navigate = useNavigate()

  if (query.isLoading) {
    return <CircularProgress />
  }

  if (query.isError) {
    return <Alert severity="error">Fehler beim Laden der Dashboard-Daten. Bitte versuchen Sie es erneut.</Alert>
  }

  if (query.isSuccess && query.data) {
    const byState = query.data.data.assignmentsByState
    const unreadByCandidature = _.countBy(unreadQuery?.data?.data, 'candidatureId')
    const candidatureWithMostMessages = _.maxBy(Object.keys(unreadByCandidature), (k) => unreadByCandidature[k])
    return <Grid display='grid' gridTemplateColumns='1fr 1fr' gap={2} >
      <Card>
        <CardHeader sx={{backgroundColor: '#ac162b', color: 'white'}} title='Nachrichten' />
        <CardContent>
          {unreadQuery.isLoading && <CircularProgress />}
          {unreadQuery.isError && <Alert severity='error' variant='outlined'>Fehler beim Laden der Nachrichten. Bitte versuchen Sie es erneut.</Alert>}
          {unreadQuery.isSuccess && unreadByCandidature && <Stack direction='column' spacing={1}>
            <Typography variant='body2'>
              Sie haben {unreadQuery.data.data.length} neue Nachrichten zu {Object.keys(unreadByCandidature).length} Bewerbung
              {Object.keys(unreadByCandidature).length === 1 ? '': 'en'}.
            </Typography>
            {candidatureWithMostMessages && <Typography variant='body2'>
              Die <Link sx={{cursor: 'pointer'}} onClick={() => navigate(`/protected/admin/conceptAssignments/${
                unreadQuery.data.data.find((m) => m.candidatureId === candidatureWithMostMessages)?.conceptId
              }/candidature/${candidatureWithMostMessages}`)} >
              Bewerbung mit den meisten ungelesenen Nachrichten</Link> hat {unreadByCandidature[candidatureWithMostMessages]} ungelesene Nachricht{
              unreadByCandidature[candidatureWithMostMessages] > 1 ? 'en': ''}.
            </Typography>}
            <Link sx={{cursor: 'pointer'}} onClick={() => navigate('/protected/admin/messages')}>Zu den Nachrichten</Link>
          </Stack>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader sx={{backgroundColor: '#ac162b', color: 'white'}} title='Vergabeverfahren' />
        <CardContent>
          {query.data.data.nextPublication && <BrandLine
            leftText='Nächster Vergabestart in'
            rightLink={`/protected/admin/conceptAssignments/${query.data.data.nextPublication.id}`}
            rightText={
              betterToHuman(DateTime.fromISO(query.data.data.nextPublication.startOrStop).diffNow(), 'hours')} />}
          {query.data.data.nextFinish && <BrandLine
            leftText='Früheste Bewerbungsfrist endet in'
            rightLink={`/protected/admin/conceptAssignments/${query.data.data.nextFinish.id}`}
            rightText={
              betterToHuman(DateTime.fromISO(query.data.data.nextFinish.startOrStop).diffNow(), 'hours')} />}
          <BrandLine
            rightLink='/protected/admin/conceptAssignments'
            leftText='Aktuell laufende Verfahren' rightText={byState['ACTIVE']?.toLocaleString('de-DE') || '0'} />
          <BrandLine
            rightLink='/protected/admin/conceptAssignments'
            leftText='Verfahren in Vorbereitung' rightText={((byState['DRAFT'] || 0) + (byState['WAITING'] || 0)).toLocaleString('de-DE')} />
          <BrandLine
            rightLink='/protected/admin/review'
            leftText='Zu prüfende Verfahren' rightText={byState['REVIEW']?.toLocaleString('de-DE') || '0'} />
          <BrandLine leftText='Abgeschlossene Verfahren' rightText={byState['FINISHED']?.toLocaleString('de-DE') || '0'} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader sx={{backgroundColor: '#ac162b', color: 'white'}} title='Bewerbungen' />
        <CardContent>
          <BrandLine
            rightLink='/protected/admin/review'
            leftText='Zu prüfende Bewerbungen' rightText={query.data.data.candidaturesInReview.toLocaleString('de-DE')} />
          <BrandLine
            rightLink='/protected/admin/conceptAssignments'
            leftText='Bewerbungen auf laufende Verfahren' rightText={query.data.data.candidaturesOnActiveAssignments.toLocaleString('de-DE')} />
        </CardContent>
      </Card>
    </Grid>
  } else {
    return <CircularProgress />
  }
}
