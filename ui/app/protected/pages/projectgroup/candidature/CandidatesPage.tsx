
import { Alert, CircularProgress, Grid, Link, Paper, Stack, Toolbar, Typography } from '@mui/material';
import { DataGrid, deDE, GridColDef, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import { UserStatus, UserStatusTranslation } from '@protected/model/user/UserStatus';
import React, {FunctionComponent } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { getCandidateListAsAdmin } from '../queries/candidature';

export const CandidatesPage: FunctionComponent<Record<string, never>> = ({ }) => {
  const navigate = useNavigate()
  const query = useQuery(['listCandidatesAsAdmin'], () => getCandidateListAsAdmin())
  const [pageSize, setPageSize] = React.useState(5)


  const columns: GridColDef[] = [
    {
      field: 'email',
      flex: 1,
      headerName: 'E-Mail',
      headerAlign: 'left',
    },
    {
      field: 'company',
      headerName: 'Firma',
      headerAlign: 'center',
      align: 'center',
      flex: 1,
    },
    {
      field: 'firstName',
      headerName: 'Name',
      headerAlign: 'center',
      align: 'center',
      flex: 1,
    },
    {
      field: 'lastName',
      headerName: 'Nachname',
      headerAlign: 'center',
      align: 'center',
      flex: 1,
    },
    {
      field: 'street',
      headerName: 'Straße',
      headerAlign: 'center',
      align: 'center',
      flex: 1,
      hide: true,
    },
    {
      field: 'houseNumber',
      headerName: 'Hausnr.',
      headerAlign: 'center',
      align: 'center',
      flex: 1,
      hide: true,
    },
    {
      field: 'zipCode',
      headerName: 'PLZ',
      headerAlign: 'center',
      align: 'center',
      flex: 1,
    },
    {
      field: 'city',
      headerName: 'Ort',
      headerAlign: 'center',
      align: 'center',
      flex: 1,
    },
    {
      field: 'userStatus',
      headerName: 'Accountstatus',
      headerAlign: 'center',
      align: 'center',
      flex: 1,
      valueGetter: (params) => UserStatusTranslation[params.row.userStatus as UserStatus],
      type: 'singleSelect',
      valueOptions: Object.keys(UserStatus).map((s) => UserStatusTranslation[s as UserStatus]),
    },
    {
      field: 'candidatures',
      flex: 1,
      headerAlign: 'left',
      align: 'left',
      headerName: 'Anzahl Bewerbungen',
      type: 'number',
    },
    {
      field: 'profile',
      flex: 1,
      headerName: 'Profil',
      headerAlign: 'right',
      align: 'right',
      sortable: false,
      filterable: false,
      hideable: false,
      renderCell: (params: GridRenderCellParams<string>) => {
        return <div>{<Link onClick={() => navigate(`/protected/admin/candidates/${params.row.userId}`)} sx={{'cursor': 'pointer'}}>Zum Profil</Link>}
        </div>
      }},
  ]

  return <Stack direction="column" spacing={1}>
    <Grid item component={Paper} sx={{pb: 2, pl: 2, pr: 2}}>
      <Toolbar sx={{pl: {sm: 2}, pr: {xs: 1}}}>
        <Typography align="left" sx={{flex: '1 1 100%'}} variant="h6"
          component="div">Bewerber:innen</Typography>
      </Toolbar>
      {query.isLoading && <CircularProgress />}
      {query.isError && <Alert severity='error'>Fehler beim Laden der Bewerber:innen. Bitte versuchen Sie es erneut.</Alert>}
      {query.isSuccess && <Stack direction="column" spacing={1}>
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ flexGrow: 1 }}>
            <DataGrid
              rows={query.data}
              columns={columns}
              pageSize={pageSize}
              rowsPerPageOptions={[5, 10, 20]}
              onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
              autoHeight={true}
              disableSelectionOnClick
              getRowId={(row) => row.userId}
              localeText={deDE.components.MuiDataGrid.defaultProps.localeText}
              components={{
                Toolbar: GridToolbar,
              }}
            />
          </div>
        </div>
      </Stack>}
    </Grid>
  </Stack>
}
