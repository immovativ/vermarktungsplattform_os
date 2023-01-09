import { Alert, Button, Card, CardActions, CardContent, Chip, CircularProgress, Divider, Grid, Paper, Stack, Toolbar, Typography } from '@mui/material';
import { LabelValue } from '@protected/components/LabelValue';
import React, {FunctionComponent } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { BuildingTypeTranslations, listActiveWaiting } from '../queries/concept-assignment';
import {DateTime, Duration} from 'luxon';
import { formatDate } from '@common/util/DateFormatter';

export function betterToHuman(dur: Duration, smallestUnit: 'seconds' | 'minutes' | 'hours' | 'days'): string {
  const units = ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'] as any;
  const smallestIdx = units.indexOf(smallestUnit);
  const entries = Object.entries(
      dur.shiftTo(...units).normalize().toObject(),
  ).filter(([_unit, amount], idx) => amount > 0 && idx <= smallestIdx);
  const dur2 = Duration.fromObject(
    entries.length === 0 ? { [smallestUnit]: 0 } : Object.fromEntries(entries),
    {locale: 'de'},
  )
  return dur2.toHuman()
}

function renderActivation(start: string, end: string): JSX.Element {
  const started = DateTime.fromISO(start).setLocale('de')
  const startedSince = started.diffNow()

  if (startedSince.valueOf() < 0) {
    return <Stack direction='column'>
      <Stack direction='row' spacing={1}>
        <Typography variant='body2' color='text.secondary'>Öffentlich seit: </Typography>
        <Typography>{betterToHuman(startedSince.negate(), 'minutes')}</Typography>
      </Stack>
      <Stack direction='row' spacing={1}>
        <Typography variant='body2' color='text.secondary'>Frist endet:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</Typography>
        <Typography>{formatDate(end)}</Typography>
      </Stack>
    </Stack>
  } else {
    return <div>
      <Typography variant='body2' color='text.secondary'>Frist startet</Typography>
      <Typography>{formatDate(start)}</Typography>
    </div>
  }
}

export const ActiveList: FunctionComponent<Record<string, never>> = ({ }) => {
  const navigate = useNavigate()

  const query = useQuery(['listCAActiveWaiting'], () => listActiveWaiting())

  return <>
    <Grid item component={Paper} sx={{pb: 2, pl: 2, pr: 2}}>
      <Toolbar sx={{pl: {sm: 2}, pr: {xs: 1}}}>
        <Typography align="left" sx={{flex: '1 1 100%'}} variant="h6"
          component="div">Aktive oder geplante Verfahren</Typography>
      </Toolbar>

      {query.isSuccess && query.data && <Grid display='grid' gridTemplateColumns='1fr 1fr 1fr' gap={2}>
        {query.data.map((item) => <Card elevation={2} key={item.assignment.id}>
          <CardContent>
            <Typography gutterBottom variant="h6" component="div">
              {item.assignment.name}{item.assignment.state === 'ACTIVE' && <>&nbsp;<Chip color='secondary' variant='outlined' label='Öffentlich' /></>}
              {item.assignment.conceptAssignmentType === 'ANCHOR' && <>&nbsp;<Chip color='secondary' variant='outlined' label='Ankerprojekt' /></>}
              {item.assignment.state === 'WAITING' && <>&nbsp;<Chip color='info' variant='outlined' label='Geplant' /></>}
            </Typography>
            <LabelValue label='Typologie' value={BuildingTypeTranslations[item.assignment.details.buildingType]} />
            <Divider sx={{mt: 1, mb: 1}} />
            {item.assignment.assignmentStart && item.assignment.assignmentEnd &&
            renderActivation(item.assignment.assignmentStart, item.assignment.assignmentEnd)}
            {item.assignment.state === 'ACTIVE' && <>
              <Divider sx={{mt: 1, mb: 1}} />
              <LabelValue label='Bewerbungen' value={item.candidatures.toLocaleString('de-DE')}/>
            </>}
          </CardContent>
          <CardActions sx={{flexGrow: 1}}>
            <Button size="small" onClick={() => navigate(`/protected/admin/conceptAssignments/${item.assignment.id}`)}>Details</Button>
          </CardActions>
        </Card>)}
      </Grid>
      }
      {query.isLoading ? <div><CircularProgress/></div> : null}
      {query.isError ? <Alert severity='error'>Fehler beim Laden der Daten.</Alert> : null}
    </Grid>
  </>
}
