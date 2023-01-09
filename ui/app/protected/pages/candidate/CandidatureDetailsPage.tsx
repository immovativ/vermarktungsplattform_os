import React, {FunctionComponent} from 'react';
import {useQuery} from 'react-query';
import {Alert, CircularProgress, Stack} from '@mui/material';
import {useParams} from 'react-router-dom';
import {getCandidature} from '@protected/pages/candidate/queries';
import {useProvideBreadcrumb} from '@common/navigation/breadcrumb/useBreadcrumb';
import {CandidatureEdit} from '@protected/pages/candidate/CandidatureEdit';
import {CandidatureDetails} from '@protected/pages/candidate/CandidatureDetails';

export const CandidatureDetailsPage: FunctionComponent = () => {
  const {candidatureId} = useParams()

  const query = useQuery(['loadCandidature', candidatureId], () => getCandidature(candidatureId as string))

  useProvideBreadcrumb(
      'assignment-name',
      {name: query.data?.conceptAssignmentWithAttachments.assignment.name ?? 'Bewerbung'},
  )

  if (query.data) {
    switch (query.data.candidatureWithAttachments.candidature.state) {
      case 'DRAFT':
        return <CandidatureEdit candidature={query.data} onChange={query.refetch}/>
      case 'SUBMITTED':
      case 'ACCEPTED':
      case 'REJECTED':
        return <CandidatureDetails candidature={query.data} onChange={query.refetch}/>
    }
  }

  return <Stack direction="column" spacing={2}>
    {query.isLoading ? <CircularProgress/> : null}
    {query.isError ? <Alert severity="error">Fehler beim Laden der Daten.</Alert> : null}
  </Stack>
}
