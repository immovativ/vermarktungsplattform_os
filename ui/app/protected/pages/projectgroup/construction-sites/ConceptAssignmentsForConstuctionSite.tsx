import { Anchor, ArrowRight } from '@mui/icons-material';
import {
  Box, IconButton, Table, TableBody, TableCell, TableContainer,
  TableFooter, TableHead, TableRow,
} from '@mui/material';
import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminConceptAssignmentListResult, BuildingTypeTranslations, ConceptAssignmentStateTranslation } from '../queries/concept-assignment';

interface Props {
  assignments: readonly AdminConceptAssignmentListResult[]
}
export const ConceptAssignmentsForConstuctionSite: FC<Props> = (props) => {
  const { assignments } = props
  const navigate = useNavigate()
  return <TableContainer>
    <Table aria-label="Vergabeverfahren-Entwürfe">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Parzelle(n)</TableCell>
          <TableCell>Typ</TableCell>
          <TableCell>Gebäudetypologie</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Aktionen</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {assignments.map((item) => (
          <TableRow key={item.assignment.id}>
            <TableCell component="th" scope="row">{item.assignment.name}</TableCell>
            <TableCell>{item.assignment.parcels.map((p) => p.parcelId).join(', ')}
            </TableCell>
            <TableCell>{item.assignment.conceptAssignmentType === 'ANCHOR' ? <Box display='flex' alignItems='center'>
              <Anchor fontSize='small' color='primary' />&nbsp;Ankerprojekt</Box> :
                  'Anliegerprojekt'}
            </TableCell>
            <TableCell>{BuildingTypeTranslations[item.assignment.details.buildingType]}</TableCell>
            <TableCell >{ConceptAssignmentStateTranslation[item.assignment.state]}</TableCell>
            <TableCell align="right">
              <IconButton onClick={() => navigate(`/protected/admin/conceptAssignments/${item.assignment.id}`)}>
                <ArrowRight />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
      </TableFooter>
    </Table>
  </TableContainer>
}
