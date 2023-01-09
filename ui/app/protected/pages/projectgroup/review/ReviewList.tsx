
import { formatDate } from '@common/util/DateFormatter';
import { Alert, Button, Card, CardActions, CardContent, CircularProgress, Divider, Grid, Paper, Stack, Toolbar, Typography } from '@mui/material';
import { LabelValue } from '@protected/components/LabelValue';
import React, {FunctionComponent } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { BuildingTypeTranslations, listReview } from '../queries/concept-assignment';

export const ReviewList: FunctionComponent<Record<string, never>> = ({ }) => {
  const navigate = useNavigate()

  const query = useQuery(['listCAReview'], () => listReview())

  return <>
    <Grid item component={Paper} sx={{pb: 2, pl: 2, pr: 2}}>
      <Toolbar sx={{pl: {sm: 2}, pr: {xs: 1}}}>
        <Typography align="left" sx={{flex: '1 1 100%'}} variant="h6"
          component="div">Vergaben mit ungeprüften Bewerbungen</Typography>
      </Toolbar>

      {query.isSuccess && query.data && <Grid display='grid' gridTemplateColumns='1fr 1fr 1fr' gap={2}>
        {query.data.map((item) => <Card elevation={2} key={item.assignment.id}>
          <CardContent>
            <Typography gutterBottom variant="h6" component="div">
              {item.assignment.name}
            </Typography>
            <LabelValue label='Typologie' value={BuildingTypeTranslations[item.assignment.details.buildingType]} />
            <Divider sx={{mt: 1, mb: 1}} />
            <Stack direction='row' spacing={1}>
              <Typography variant='body2' color='text.secondary'>In Prüfung seit:&nbsp;</Typography>
              <Typography>{item.assignment.assignmentEnd && formatDate(item.assignment.assignmentEnd)}</Typography>
            </Stack>
            <Divider sx={{mt: 1, mb: 1}} />
            <Stack justifyContent='center' direction='row' spacing={1}>
              <LabelValue label='Zu prüfende Bewerbungen' value={item.undecidedCandidatures.toLocaleString('de-DE')}/>
              <LabelValue label='Bewerbungen gesamt' value={item.candidatures.toLocaleString('de-DE')}/>
            </Stack>
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
