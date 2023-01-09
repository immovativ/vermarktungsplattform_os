import { Grid } from '@mui/material'
import { ConstructionSiteDetailsKeys, ConstructionSiteDetailsKeysTranslation, ConstructionSiteKey } from '@protected/model/ConstructionSite'
import { getConstructionSiteDetails } from '@protected/pages/projectgroup/construction-sites/queries'
import React, { FC } from 'react'
import { useQuery } from 'react-query'
import { PoorMansStatCard } from '../StatCard'

interface ConstructionSiteDetailStatsProps {
  constructionSiteKey: ConstructionSiteKey
}

export const ConstructionSiteDetailStats: FC<ConstructionSiteDetailStatsProps> = (props) => {
  const {
    constructionAreaId,
    constructionSiteId,
  } = props.constructionSiteKey

  const constructionDetails = useQuery(
      ['constructionSiteDetails', constructionAreaId, constructionSiteId],
      () => getConstructionSiteDetails(
          constructionAreaId,
          constructionSiteId,
      ),
  );

  return constructionDetails.isSuccess ?
            <Grid
              display="grid"
              gridTemplateColumns="1fr 1fr"
              gap={2}
            >
              {Object.keys(constructionDetails.data)
                  .filter((i): i is ConstructionSiteDetailsKeys => i != 'key')
                  .map((key: ConstructionSiteDetailsKeys) => {
                    const label = ConstructionSiteDetailsKeysTranslation[key]
                    const value = constructionDetails.data[key]
                    return <PoorMansStatCard
                      key={label}
                      label={label}
                      value={value}
                    />
                  })}
            </Grid> :
              null
}
