import React, { FunctionComponent, useMemo} from 'react';
import {getSession} from '@common/navigation/session/Session';
import {UserRole} from '@protected/model/user/UserRole';
import {
  Alert, AlertTitle, Box,
  Button,
  Card,
  CardContent,
  CardHeader, CardMedia,
  CircularProgress,
  Divider,
  Grid,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import {createCandidature, getCandidatureState, getConceptAssignment} from '@public/pages/queries';
import {useNavigate, useParams} from 'react-router-dom';
import {useQuery} from 'react-query';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {LoadingButton} from '@common/component/LoadingButton';
import {BuildingTypeTranslations} from '@protected/pages/projectgroup/queries/concept-assignment';
import {FeatureMap} from '@protected/components/map/FeatureMap';
import GeoJSON from 'ol/format/GeoJSON';
import { useProvideBreadcrumb } from '@common/navigation/breadcrumb/useBreadcrumb';
import { ConstructionSiteDetailStats } from '@common/component/construction-site/ConstructionSiteDetailStats';
import { PoorMansStatCard } from '@common/component/StatCard';

function renderDetail(text: string, detail: string | number | null | undefined): JSX.Element {
  return <PoorMansStatCard
    label={text}
    value={detail?.toString() || ''}
  />
}

export const ConceptAssignmentDetail: FunctionComponent = () => {
  const {id} = useParams();
  const navigate = useNavigate()

  if (!id) {
    return (<div>Keine Vergabe angegeben</div>);
  }

  const query = useQuery(['public', 'conceptAssignment', id], () => getConceptAssignment(id));
  const firstParcel = query.data?.parcels[0]

  const loggedIn = (getSession()?.role === UserRole.CANDIDATE)

  useProvideBreadcrumb('assignment-name', {
    name: query.data?.name ?? 'Vergabe laedt...',
  })

  const stateQuery = useQuery(
      ['public', 'candidature', 'state', id],
      () => getCandidatureState(id),
      {
        enabled: !query.isSuccess && loggedIn,
      },
  );

  const createCandidatureMutation = useBetterMutation(() => createCandidature(id), {
    onSuccess: (result) => {
      window.location.href = `/protected/candidate/candidatures/${result.data.id}`;
    },
  });
  const parcels = query.data?.parcels
  const shape = useMemo(
      () => parcels ? parcels.map((p) => new GeoJSON().readFeature(p.shape)) : undefined,
      [JSON.stringify(parcels)],
  )

  return (
    <Card sx={{m: 2}}>
      <CardHeader title={
        <Stack direction="row" spacing={1} justifyContent="space-between">
          <Typography variant="h5">{query.data?.name}</Typography>

          <Stack direction="row" spacing={2}>
            <Button component={Link} onClick={() => navigate('/vergabe')}>Zurück zur Karte</Button>

            {loggedIn ?
              stateQuery.data ?
                <Button
                  component={Link}
                  href={`/protected/candidate/candidatures/${stateQuery.data.candidatureId}`}
                  variant="contained"
                >
                  Zur Bewerbung
                </Button> :
                <LoadingButton
                  loading={createCandidatureMutation.isLoading}
                  onClick={createCandidatureMutation.mutate}
                  variant="contained"
                >
                  Bewerben
                </LoadingButton> :
              <Button
                component={Link}
                href={`/protected/login?conceptAssignmentId=${id}`}
                variant="contained"
              >
                Anmelden zum Bewerben
              </Button>
            }
          </Stack>
        </Stack>
      }/>

      <CardMedia>
        <Box sx={{width: '100%', height: '400px'}}>
          {shape && <FeatureMap features={shape}/>}
        </Box>
      </CardMedia>

      <CardContent>
        <Stack direction="column" spacing={2}>
          {query.data !== null && query.data?.conceptAssignmentType === 'ANCHOR' && <Alert severity='info' variant='outlined'>
            <AlertTitle>Ankerprojekt</AlertTitle>
            Bei dieser Vergabe wird ein Ankerprojekt gesucht.<br/>
            Somit fallen neben der Umsetzung des eigenen Projektes
            auch notwendige Querschnittsaufgaben innerhalb des gesamten Baufelds an.<br/><br/>
            Bitte beachten Sie dies bei der Erwägung einer Bewerbung auf dieses Projekt.
          </Alert>}
          <Typography variant="h6">
            Daten
          </Typography>
          {firstParcel && <ConstructionSiteDetailStats
            constructionSiteKey={firstParcel}
          />}
          <Grid display="grid" gridTemplateColumns="1fr 1fr" gap={2} sx={{mt: 2}}>
            {renderDetail('Gebäudeart', query.data?.details?.buildingType ? BuildingTypeTranslations[query.data?.details?.buildingType] : '-')}
            {renderDetail('Zulässige Geschosse', query.data?.details?.allowedFloors)}
            {renderDetail('Zulässige Gebäudehöhe (in Meter)', query.data?.details?.allowedBuildingHeightMeters)}
          </Grid>

          <Divider/>

          <Typography variant="h6">
            Besondere Vorgaben
          </Typography>

          <Grid container>
            <Grid item xs={4}>
              <Typography variant="subtitle2">
                Energetische Vorgaben
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Typography variant="body2" sx={{whiteSpace: 'pre-line'}}>
                {query.data?.details?.energyText || '-'}
              </Typography>
            </Grid>
          </Grid>

          {query.isError ? <Alert severity="error">Fehler beim Laden der Daten</Alert> : null}
          {createCandidatureMutation.error ? <Alert severity="error">Fehler beim Erstellen der Bewerbung</Alert> : null}
          {query.isLoading ? <CircularProgress/> : null}

        </Stack>
      </CardContent>
    </Card>
  )
}

export default ConceptAssignmentDetail
