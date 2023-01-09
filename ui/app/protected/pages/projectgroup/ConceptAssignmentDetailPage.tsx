import { Alert, Box, CircularProgress, Stack } from '@mui/material';
import { BreadcrumbConfig, useProvideBreadcrumb } from '@common/navigation/breadcrumb/useBreadcrumb';
import React, {FunctionComponent } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { ActiveAssignmentDetail } from './active-assignments/ActiveAssignmentDetail';
import { WaitingAssignmentDetail } from './active-assignments/WaitingAssignmentDetail';
import { AbortedDetail } from './archive/AbortedDetail';
import { DraftDetail } from './draft/DraftDetail';
import { GrantedAssignment } from './granted/GrantedAssignment';
import { AdminConceptAssignmentDetailWithAttachments, getDetail } from './queries/concept-assignment';
import { AssignmentReview } from './review/AssignmentReview';

export const ConceptAssignmentsDetailPage: FunctionComponent<Record<string, never>> = ({ }) => {
  const param = useParams()
  const id = param.id as string

  const queryClient = useQueryClient()
  const query = useQuery(['getCADetail', id], () => getDetail(id))
  const updateFromMutation = (ca: AdminConceptAssignmentDetailWithAttachments) => queryClient.setQueryData(['getCADetail', id], ca)

  const breadcrumbConfig: BreadcrumbConfig = []


  const assignmentState = query.data?.assignment.state
  if (assignmentState !== undefined) {
    switch (assignmentState) {
      case 'WAITING':
      case 'ACTIVE': {
        breadcrumbConfig.push({
          name: 'Aktiv/Geplant',
          link: '/protected/admin/conceptAssignments/active',
        })
        break
      }
      case 'DRAFT': {
        breadcrumbConfig.push({
          name: 'Entwürfe',
          link: '/protected/admin/conceptAssignments/drafts',
        })
        break
      }

      case 'REVIEW': {
        breadcrumbConfig.push({
          name: 'Zu prüfende Bewerbungen',
          link: '/protected/admin/review',
        })
        break
      }
      case 'ABORTED':
      case 'FINISHED': {
        breadcrumbConfig.push({
          name: 'Abgeschlossene Verfahren',
          link: '/protected/admin/conceptAssignments/done',
        })
        break
      }
    }
  }

  useProvideBreadcrumb('assignment-name', [
    ...breadcrumbConfig,
    {name: query.data?.assignment.name ?? null},
  ])

  const renderByState: (ca: AdminConceptAssignmentDetailWithAttachments) => JSX.Element = (ca) => {
    switch (ca.assignment.state) {
      case 'DRAFT': return <DraftDetail detail={ca} updateFromMutation={updateFromMutation} />
      case 'ACTIVE': return <ActiveAssignmentDetail detail={ca} updateFromMutation={updateFromMutation} />
      case 'WAITING': return <WaitingAssignmentDetail detail={ca} updateFromMutation={updateFromMutation} />
      case 'REVIEW': return <AssignmentReview detail={ca} updateFromMutation={updateFromMutation} />
      case 'FINISHED': return <GrantedAssignment detail={ca} />
      case 'ABORTED': return <AbortedDetail detail={ca}/>
    }
  }

  return <Stack direction="column" spacing={1}>
    {query.isLoading ? <div><CircularProgress/></div> : null}
    {query.isError ? <Alert severity='error'>Fehler beim Laden der Daten.</Alert> : null}
    <Box>
      {query.isSuccess && query.data && renderByState(query.data)}
    </Box>
  </Stack>
}
