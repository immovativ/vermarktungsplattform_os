import { Button, Grid, styled } from '@mui/material'
import { DataGrid, GridRenderCellParams, GridSelectionModel } from '@mui/x-data-grid'
import { ConstructionSite } from '@protected/model/ConstructionSite'
import React, {FC, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { ConstructionSiteMap } from './ConstructionSiteMap'

interface ConstructionSiteListProps {
  constructionSites: ConstructionSite[]
}

const MapWrapper = styled('div')({
  height: 500,
  border: '1px solid rgb(224, 224, 224)',
  borderRadius: '4px',
})

export const ConstructionSiteList: FC<ConstructionSiteListProps> = ({constructionSites}) => {
  const navigate = useNavigate()
  const [pageSize, setPageSize] = useState(10)
  const [gridSelection, setGridSelection] = useState<GridSelectionModel>([])

  function constructionSiteSelected(fid: string) {
    setGridSelection([fid])
  }

  return <Grid display='grid' gridTemplateColumns={'1fr 500px'} gap={4}>
    <DataGrid
      autoHeight
      rows={constructionSites.map((el) => ({
        id: el.fid,
        ...el,
      }))}
      pageSize={pageSize}
      rowsPerPageOptions={[5, 10, 20]}
      onPageSizeChange={(pageSize) => setPageSize(pageSize)}
      onSelectionModelChange={setGridSelection}
      selectionModel={gridSelection}
      columns={[
        {
          field: 'constructionAreaId',
          flex: 1,
          headerName: `Bauabschnitt`,
        },
        {
          field: 'constructionSiteId',
          flex: 1,
          headerName: `Baufeld`,
        },
        {
          field: 'comment',
          flex: 1,
          headerName: `Bemerkung`,
        },
        {
          field: 'fid',
          flex: 1,
          headerName: `fid`,
        },
        {
          field: 'action',
          headerName: 'Aktion',
          flex: 1,
          renderCell: ({row}: GridRenderCellParams<string, ConstructionSite>) => {
            return <Button onClick={() => navigate(`${row.constructionAreaId}/${row.constructionSiteId}`)}>Detailansicht</Button>
          }},
      ]}
    />
    <MapWrapper>
      <ConstructionSiteMap
        constructionSites={constructionSites}
        selectedConstructionSiteFids={gridSelection}
        constructionSiteSelected={constructionSiteSelected} />
    </MapWrapper>
  </Grid>
}
