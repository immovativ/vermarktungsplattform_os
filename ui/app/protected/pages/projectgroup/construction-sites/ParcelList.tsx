import styled from '@emotion/styled';
import { Grid } from '@mui/material';
import { DataGrid, GridRenderCellParams, GridSelectionModel } from '@mui/x-data-grid';
import { Parcel, parcelTypeTranslations } from '@protected/model/Parcel';
import React, { FC, useState } from 'react'
import { ParcelMap } from './ParcelMap';

interface Props {
    parcels: Parcel[]
}

const MapWrapper = styled('div')({
  height: 400,
  border: '1px solid rgb(224, 224, 224)',
  borderRadius: '4px',
})


export const ParcelList: FC<Props> = ({parcels}) => {
  const [pageSize, setPageSize] = useState(20)

  const [gridSelection, setGridSelection] = useState<GridSelectionModel>([])

  function parcelSelected(parcelId: string) {
    setGridSelection([parcelId])
  }

  return <Grid display='grid' gridTemplateColumns={'1fr 400px'} gap={4}>
    <DataGrid
      autoHeight
      pageSize={pageSize}
      rowsPerPageOptions={[5, 10, 20]}
      onPageSizeChange={(pageSize) => setPageSize(pageSize)}
      onSelectionModelChange={setGridSelection}
      selectionModel={gridSelection}
      rows={parcels.map((el) => ({id: el.parcelId, ...el}) )}
      columns={
        [
          {
            field: 'parcelId',
            flex: 1,
            headerName: 'Parzelle',
          },
          {
            field: 'fid',
            flex: 1,
            headerName: 'fid',
          },
          {
            field: 'area',
            flex: 1,
            headerName: 'Fläche',
          },
          {
            field: 'parcelType',
            flex: 2,
            headerName: 'Typ',
            renderCell: ({row}: GridRenderCellParams<string, Parcel>) => {
              return parcelTypeTranslations[row.parcelType]
            },
          },
        ]
      }
    />
    <MapWrapper>
      <ParcelMap parcels={parcels} selectedParcelIds={gridSelection} parcelSelected={parcelSelected} />
    </MapWrapper>
  </Grid>;
}
