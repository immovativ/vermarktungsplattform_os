import {
  Alert, CircularProgress,
} from '@mui/material';
import React, {FunctionComponent} from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import { getCandidatureDetailAsAdmin } from '../queries/candidature';
import { CandidatureDetail } from './CandidatureDetail';

export const CandidatureDetailLoader: FunctionComponent = () => {
  const candidatureId = useParams().cid

  const query = useQuery(['candidature-detail', candidatureId], () => getCandidatureDetailAsAdmin(candidatureId as string),
      { enabled: !!candidatureId })

  if (candidatureId === undefined) {
    return <Alert severity='error' variant='outlined'>Die Bewerbung konnte nicht gefunden werden.</Alert>
  } else if (query.isLoading) {
    return <CircularProgress />
  } else if (query.isError || query.data === undefined) {
    return <Alert severity='error' variant='outlined'>Die Bewerbung konnte nicht geladen werden.</Alert>
  } else {
    return <CandidatureDetail v={query.data} candidatureId={candidatureId} />
  }
}
