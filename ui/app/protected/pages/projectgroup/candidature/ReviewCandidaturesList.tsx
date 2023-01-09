import { Alert, Chip, Link, Rating, Stack } from '@mui/material';
import React, { FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CandidatureWithUser } from '../queries/concept-assignment';
import { DataGrid, deDE, GridColDef, GridComparatorFn, gridNumberComparator, GridRenderCellParams,
  gridStringOrNumberComparator, GridToolbar } from '@mui/x-data-grid';
import { CandidatureState, CandidatureStates } from '@protected/model/candidature/Candidature';
import {DateTime} from 'luxon';

interface Props {
    candidatures: readonly CandidatureWithUser[]
}

function labelForState(state: CandidatureState): string {
  switch (state) {
    // should never happen
    case 'DRAFT':
    case 'SUBMITTED': return 'Bewerbung in Prüfung'
    case 'REJECTED': return 'Bewerbung konnte nicht berücksichtigt werden'
    case 'ACCEPTED': return 'Zuschlag erteilt'
  }
}

function chipForState(state: CandidatureState): JSX.Element {
  switch (state) {
    // should never happen
    case 'DRAFT':
    case 'SUBMITTED': return <Chip label={labelForState(state)} color='info' variant='outlined' />
    case 'REJECTED': return <Chip label={labelForState(state)} color='error' />
    case 'ACCEPTED': return <Chip label={labelForState(state)} color='success' />
  }
}

const stateComparator: GridComparatorFn = (v1, v2, param1, param2) => {
  return gridStringOrNumberComparator(
      v1,
      v2,
      param1,
      param2,
  )
}

const ratingComparator: GridComparatorFn = (v1, v2, param1, param2) => {
  return gridNumberComparator(
      v1 as number | null,
      v2 as number | null,
      param1,
      param2,
  )
}

export const ReviewCandidaturesList: FunctionComponent<Props> = ({
  candidatures,
}) => {
  const navigate = useNavigate()
  const [pageSize, setPageSize] = React.useState(5)

  const columns: GridColDef[] = [
    {
      'field': 'candidature',
      'width': 200,
      'headerName': 'Zustand',
      'renderCell': (params) => chipForState(params.row.candidature.state),
      'valueGetter': (params) => labelForState(params.row.candidature.state),
      'sortComparator': stateComparator,
      'type': 'singleSelect',
      'valueOptions': CandidatureStates.filter((s) => s !== 'DRAFT').map((s) => labelForState(s)).slice(),
    },
    {
      'field': 'rating',
      'flex': 1,
      'headerAlign': 'center',
      'align': 'center',
      'type': 'number',
      'headerName': 'Bewertung',
      'renderCell': (params) => <Rating value={params.row.rating} readOnly />,
      'sortComparator': ratingComparator,
      'valueGetter': (params) => params.row.rating,
    },
    {
      'field': 'user.company',
      'flex': 1,
      'headerAlign': 'center',
      'align': 'center',
      'headerName': 'Firma',
      'valueGetter': (params) => params.row.user.company,
    },
    {
      'field': 'user.firstName',
      'flex': 1,
      'headerName': 'Vorname',
      'headerAlign': 'center',
      'align': 'center',
      'valueGetter': (params) => params.row.user.firstName,
    },
    {
      'field': 'user.lastName',
      'flex': 1,
      'headerName': 'Nachname',
      'headerAlign': 'center',
      'align': 'center',
      'valueGetter': (params) => params.row.user.lastName,
    },
    {
      'field': 'user.street',
      'flex': 1,
      'headerName': 'Straße',
      'headerAlign': 'center',
      'align': 'center',
      'valueGetter': (params) => params.row.user.street,
    },
    {
      'field': 'user.houseNumber',
      'flex': 1,
      'headerName': 'Hausnr.',
      'headerAlign': 'center',
      'align': 'center',
      'valueGetter': (params) => params.row.user.houseNumber,
    },
    {
      'field': 'user.zipCode',
      'flex': 1,
      'headerName': 'PLZ',
      'headerAlign': 'center',
      'align': 'center',
      'valueGetter': (params) => params.row.user.zipCode,
    },
    {
      'field': 'user.city',
      'flex': 1,
      'headerName': 'Ort',
      'headerAlign': 'center',
      'align': 'center',
      'valueGetter': (params) => params.row.user.city,
    },
    {
      'field': 'user.email',
      'flex': 1,
      'headerName': 'E-Mail',
      'headerAlign': 'center',
      'align': 'center',
      'valueGetter': (params) => params.row.user.email,
    },
    {
      'field': 'ts',
      'type': 'dateTime',
      'headerAlign': 'center',
      'align': 'center',
      'flex': 1,
      'headerName': 'Bewerbung eingegangen',
      'valueGetter': (params) => DateTime.fromISO(params.row.candidature.updatedAt).toJSDate(),
    },
    {
      'field': 'link',
      'flex': 1,
      'sortable': false,
      'filterable': false,
      'hideable': false,
      'headerAlign': 'right',
      'align': 'right',
      'headerName': 'Link',
      'renderCell': (params: GridRenderCellParams<string>) => {
        return <div>{<Link onClick={() => navigate(`candidature/${params.row.candidature.id}`)} sx={{'cursor': 'pointer'}}>Zur Bewerbung</Link>}
        </div>
      }},
  ]

  return <Stack direction="column">
    {candidatures.length === 0 && <Alert severity='info' variant='outlined'>Keine Bewerbungen für diese Vergabe.</Alert>}

    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flexGrow: 1 }}>
        <DataGrid
          rows={candidatures}
          columns={columns}
          pageSize={pageSize}
          rowsPerPageOptions={[5, 10]}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          autoHeight={true}
          disableSelectionOnClick
          getRowId={(row) => row.candidature.id}
          localeText={deDE.components.MuiDataGrid.defaultProps.localeText}
          components={{
            Toolbar: GridToolbar,
          }}
          initialState={{
            columns: {
              columnVisibilityModel: {
                'user.email': false,
                'ts': false,
              },
            },
            sorting: {
              sortModel: [{ field: 'state', sort: 'desc' }],
            },
          }}
        />
      </div>
    </div>
  </Stack>
}
