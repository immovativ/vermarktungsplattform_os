import { DelegatedIdContext } from '@common/util/DelegatedIdContext'
import { CircularProgress } from '@mui/material'
import { CandidatureEdit } from '@protected/pages/candidate/CandidatureEdit'
import React, {FC, useEffect} from 'react'
import { useQuery } from 'react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getAllCandidatureDetailAsAdmin } from '../queries/candidature'


export const DelegateEdit: FC = () => {
  const candidatureId = useParams().cid

  const navigate = useNavigate()

  const query = useQuery(['candidature-detail', candidatureId], () => getAllCandidatureDetailAsAdmin(candidatureId as string),
      { enabled: !!candidatureId })


  useEffect(() => {
    if (query.data?.details.candidatureWithAttachments.candidature.state == 'SUBMITTED') {
      const conceptId = query.data?.details.conceptAssignmentWithAttachments.assignment.id
      const candidatureId = query.data.details.candidatureWithAttachments.candidature.id
      navigate(`/protected/admin/conceptAssignments/${conceptId}/candidature/${candidatureId}`)
    }
  }, [query.data?.details.candidatureWithAttachments.candidature.state])


  if (query.data == undefined) {
    return <CircularProgress />
  } else {
    return <DelegatedIdContext.Provider value={query.data.user.userId}>
      <CandidatureEdit
        delegateId={query.data.user.userId}
        candidature={query.data.details}
        onChange={() => query.refetch()}
      />
    </DelegatedIdContext.Provider>
  }
}
