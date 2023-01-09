import { useProvideBreadcrumb } from '@common/navigation/breadcrumb/useBreadcrumb'
import { Alert, CircularProgress } from '@mui/material'
import React, { FC } from 'react'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'
import { listForConstructionSite } from '../queries/concept-assignment'
import { ParcelList } from './ParcelList'
import { ConceptAssignmentsForConstuctionSite } from './ConceptAssignmentsForConstuctionSite'
import { ConstructionSiteDetailsEdit } from './ConstructionSiteDetailsEdit'
import { getConstructionSiteDetails, getParcels, updateConstructionSiteDetails } from './queries'
import { useBetterMutation } from '@common/hooks/useBetterMutationHook'


export const ConstructionDetailPage: FC = () => {
  const {cAreaId, cSiteId} = useParams()
  if (!cAreaId || !cSiteId) {
    return null;
  }

  const {data: parcelData, status: parcelStatus} = useQuery(['parcels', cAreaId, cSiteId], () => getParcels(cAreaId, cSiteId))

  const {data: assignmentsData, status: assignmentsStatus} = useQuery(['getCADrafts', cAreaId, cSiteId], () => listForConstructionSite(cAreaId, cSiteId))
  const {
    data: detailsData,
    status: detailsStatus,
    refetch: detailsRefetch,
    isFetching,
  } = useQuery(['constructionSiteDetails', cAreaId, cSiteId], () => getConstructionSiteDetails(cAreaId, cSiteId))

  const constructionDetailMutation = useBetterMutation(
      ({cAreaId, cSiteId, payload}) => updateConstructionSiteDetails(cAreaId, cSiteId, payload),
      {
        onSuccess: detailsRefetch,
      },
  )

  useProvideBreadcrumb('construction-name', {
    name: `Baufeld ${cAreaId}.${cSiteId}`,
  })

  return <>
    <h1>Baufeld Detailseite</h1>

    <h2>Baufeldinformationen</h2>
    <div>
      {detailsStatus == 'loading' && <CircularProgress />}
      {detailsStatus === 'success' && <ConstructionSiteDetailsEdit
        details={detailsData}
        onDetailsUpdate={(details) => constructionDetailMutation.mutate({cAreaId, cSiteId, payload: details})}
        isLoading={constructionDetailMutation.isLoading || isFetching}
      />}
      {detailsStatus == 'error' && <Alert severity="error">Konnte Baufeldinformationen nicht laden.</Alert>}
    </div>
    <h2>Parzellen</h2>
    <div>
      {parcelStatus == 'loading' && <CircularProgress />}
      {parcelStatus === 'success' && <ParcelList parcels={parcelData} />}
      {parcelStatus == 'error' && <Alert severity="error">Konnte Parzellen nicht laden.</Alert>}
    </div>
    <h2>Vergabeverfahren</h2>
    <div>
      {assignmentsStatus == 'loading' && <CircularProgress />}
      {assignmentsStatus === 'success' && assignmentsData && <ConceptAssignmentsForConstuctionSite assignments={assignmentsData} />}
      {assignmentsStatus == 'error' && <Alert severity="error">Konnte Vergabeverfahren nicht laden.</Alert>}
    </div>
  </>
}
