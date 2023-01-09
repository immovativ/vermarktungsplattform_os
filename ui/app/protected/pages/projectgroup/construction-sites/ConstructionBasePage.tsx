import { LoadingButton } from '@common/component/LoadingButton'
import { useBetterMutation } from '@common/hooks/useBetterMutationHook'
import { ConstructionSite } from '@protected/model/ConstructionSite'
import axios from 'axios'
import React, { FC } from 'react'
import { useQuery } from 'react-query'
import { ConstructionSiteList } from './ConstructionSiteList'

async function getConstructionSites(): Promise<ConstructionSite[]> {
  return (await axios.get('/api/construction-area/all')).data
}

export const ConstructionBasePage: FC = () => {
  const constructionSitesResponse = useQuery(['construction-sites', 'all'], () => getConstructionSites())

  const importConstructionSites = useBetterMutation(() => axios.post('/api/construction-area/import'),
      {
        onSuccess: constructionSitesResponse.refetch,
      },
  )
  return <>
    <h1>Baufeld-Manager</h1>
    {constructionSitesResponse.isSuccess &&
      (constructionSitesResponse.data.length === 0 ?
      <div>
        <p>
          Keine Baufelder vorhanden.
        </p>
        <LoadingButton
          loading={importConstructionSites.isLoading}
          onClick={importConstructionSites.mutate} variant="contained">Jetzt importieren</LoadingButton>
      </div> :
      <ConstructionSiteList
        constructionSites={constructionSitesResponse.data}
      />)
    }
  </>
}
