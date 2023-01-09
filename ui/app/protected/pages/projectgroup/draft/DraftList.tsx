import { Add, Anchor, Delete, Edit } from '@mui/icons-material';
import {
  Alert, Box, CircularProgress, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer,
  TableFooter, TableHead, TableRow, Toolbar, Tooltip, Typography,
} from '@mui/material';
import React, { FunctionComponent } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { BuildingTypeTranslations, listDrafts } from '../queries/concept-assignment';
import { DeleteDraftModal } from './DeleteDraftModal';
import { NewConceptAssignmentModal } from './NewConceptAssignmentModal';

export const DraftList: FunctionComponent<Record<string, never>> = ({ }) => {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = React.useState<string | null>(null)
  const navigate = useNavigate()

  const query = useQuery(['getCADrafts'], () => listDrafts())

  return <>
    <Grid item component={Paper} sx={{pb: 2, pl: 2, pr: 2}}>
      <Toolbar sx={{pl: {sm: 2}, pr: {xs: 1}}}>
        <Typography align="left" sx={{flex: '1 1 100%'}} variant="h6"
          component="div">Entwürfe</Typography>

        <Tooltip title="Vergabeverfahren für Ankerprojekt anlegen">
          <IconButton color="primary" onClick={() => setModalOpen(true)}>
            <Add fontSize="large"/>
          </IconButton>
        </Tooltip>
      </Toolbar>

      {query.isSuccess && query.data && <TableContainer>
        <Table aria-label="Vergabeverfahren-Entwürfe">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Gebäudetypologie</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {query.data.map((item) => (
              <TableRow key={item.assignment.id}>
                <TableCell component="th" scope="row">{item.assignment.name}</TableCell>
                <TableCell>{item.assignment.conceptAssignmentType === 'ANCHOR' ? <Box display='flex' alignItems='center'>
                  <Anchor fontSize='small' color='primary' />&nbsp;Ankerprojekt</Box> :
                  'Anliegerprojekt'}
                </TableCell>
                <TableCell>{BuildingTypeTranslations[item.assignment.details.buildingType]}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Entfernen">
                    <IconButton
                      onClick={() => setDeleteModalOpen(item.assignment.id)}
                      aria-label="Vergabeverfahren löschen">
                      <Delete/>
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Verfahren bearbeiten/starten">
                    <IconButton onClick={() => navigate(`/protected/admin/conceptAssignments/${item.assignment.id}`)}>
                      <Edit/>
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
          </TableFooter>
        </Table>
      </TableContainer>}
      {query.isLoading ? <div><CircularProgress/></div> : null}
      {query.isError ? <Alert severity='error'>Fehler beim Laden der Daten.</Alert> : null}
    </Grid>
    {deleteModalOpen && <DeleteDraftModal
      onCancel={() => setDeleteModalOpen(null)}
      onDeleted={() => {
        setDeleteModalOpen(null); query.refetch()
      }}
      cid={deleteModalOpen}
    />}
    {modalOpen && <NewConceptAssignmentModal onClose={() => setModalOpen(false)} anliegerUsingAnchor={null}
      onSuccess={(detail) => {
        setModalOpen(false); navigate(`/protected/admin/conceptAssignments/${detail.id}`)
      }} />}
  </>
}
