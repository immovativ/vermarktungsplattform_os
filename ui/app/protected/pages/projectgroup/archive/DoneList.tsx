import { Visibility } from '@mui/icons-material';
import {
  Alert, CircularProgress, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer,
  TableFooter, TableHead, TableRow, Toolbar, Tooltip, Typography,
} from '@mui/material';
import React, { FunctionComponent } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { BuildingTypeTranslations, ConceptAssignmentStateTranslation, listDone } from '../queries/concept-assignment';

export const DoneList: FunctionComponent<Record<string, never>> = ({ }) => {
  const navigate = useNavigate()

  const query = useQuery(['getCADone'], () => listDone())

  return <>
    <Grid item component={Paper} sx={{pb: 2, pl: 2, pr: 2}}>
      <Toolbar sx={{pl: {sm: 2}, pr: {xs: 1}}}>
        <Typography align="left" sx={{flex: '1 1 100%'}} variant="h6"
          component="div">Abgeschlossene Verfahren</Typography>
      </Toolbar>
      {query.isSuccess && query.data && <TableContainer>
        <Table aria-label="Abgeschlossene Verfahren">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Gebäudetypologie</TableCell>
              <TableCell>Zustand</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {query.data.map((item) => (
              <TableRow key={item.assignment.id}>
                <TableCell component="th" scope="row">{item.assignment.name}</TableCell>
                <TableCell>{BuildingTypeTranslations[item.assignment.details.buildingType]}</TableCell>
                <TableCell>{ConceptAssignmentStateTranslation[item.assignment.state]}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Verfahren öffnen">
                    <IconButton onClick={() => navigate(`/protected/admin/conceptAssignments/${item.assignment.id}`)}>
                      <Visibility />
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
  </>
}
