import React, {FunctionComponent} from 'react';
import {useQuery} from 'react-query';
import {listCandidatures} from '@protected/pages/candidate/queries';
import {
  Alert, Button,
  Card, CardActions,
  CardContent, CardMedia,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import CardHeader from '@mui/material/CardHeader';
import {formatDate} from '@common/util/DateFormatter';
import {CandidatureState, CandidatureStateTranslations} from '@protected/model/candidature/Candidature';
import {useNavigate} from 'react-router-dom';
import {ConceptAssignmentStateTranslation} from '@protected/pages/projectgroup/queries/concept-assignment';

const submittedStates: CandidatureState[] = ['SUBMITTED', 'ACCEPTED', 'REJECTED'];

export const CandidatureListPage: FunctionComponent = () => {
  const query = useQuery(['listCandidatures'], () => listCandidatures())

  const navigateTo = useNavigate()

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6">
          Eingereichte Bewerbungen
        </Typography>
      </Grid>

      {query.isSuccess && query.data.filter((c) => submittedStates.includes(c.state)).map((candidature) =>
        <Grid item key={candidature.id} xs={6}>
          <Card sx={{'backgroundColor': 'honeydew'}}>
            <CardMedia>
              {candidature.state === 'ACCEPTED' &&
                <Alert severity="success" variant="filled" sx={{borderRadius: 0}}>Ihre Bewerbung wurde akzeptiert.</Alert>
              }
              {candidature.state === 'REJECTED' &&
                <Alert severity="error" variant="filled" sx={{borderRadius: 0}}>Ihre Bewerbung wurde abgelehnt.</Alert>
              }
            </CardMedia>
            <CardHeader title={
              <Typography variant="subtitle1">{candidature.conceptDetails.name}</Typography>
            }/>
            <CardContent>
              <Typography variant="body2">
                Bewerbungsfrist: <strong>{candidature.conceptDetails.assignmentEnd ? formatDate(candidature.conceptDetails.assignmentEnd) : 'k.a.'}</strong>
              </Typography>
              {candidature.conceptDetails.state === 'REVIEW' &&
              <Typography variant="body2">
                Status: <strong>{ConceptAssignmentStateTranslation[candidature.conceptDetails.state]}</strong>
              </Typography>
              }
              {candidature.conceptDetails.state !== 'REVIEW' &&
              <Typography variant="body2">
                Status: <strong>{CandidatureStateTranslations[candidature.state]}</strong>
              </Typography>
              }
            </CardContent>
            <CardActions>
              <Button onClick={() => navigateTo(`/protected/candidate/candidatures/${candidature.id}`)}>
                Bewerbung ansehen
              </Button>
            </CardActions>
          </Card>
        </Grid>,
      )}

      <Grid item xs={12}>
        <Typography variant="h6">
          Nicht eingereichte Bewerbungen
        </Typography>
      </Grid>

      {query.isSuccess && query.data.filter((c) => c.state === 'DRAFT').map((candidature) =>
        <Grid item key={candidature.id} xs={6}>
          <Card sx={{'backgroundColor': 'linen'}}>
            <CardHeader title={
              <Typography variant="subtitle1">{candidature.conceptDetails.name}</Typography>
            }/>
            <CardContent>
              <Typography variant="body2">
                Bewerbungsfrist: <strong>{candidature.conceptDetails.assignmentEnd ? formatDate(candidature.conceptDetails.assignmentEnd) : 'k.a.'}</strong>
              </Typography>
              <Typography variant="body2">
                Status: <strong>{CandidatureStateTranslations[candidature.state]}</strong>
              </Typography>
            </CardContent>
            <CardActions>
              <Button onClick={() => navigateTo(`/protected/candidate/candidatures/${candidature.id}`)}>
                Bewerbung bearbeiten
              </Button>
            </CardActions>
          </Card>
        </Grid>,
      )}

      {query.isLoading ? <Grid item xs={12}><CircularProgress/></Grid> : null}
      {query.isError ? <Grid item xs={12}><Alert severity="error">Fehler beim Laden der Daten.</Alert></Grid> : null}
    </Grid>
  )
}
