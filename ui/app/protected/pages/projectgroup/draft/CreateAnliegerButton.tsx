import { Box, Button } from '@mui/material';
import { ConstructionSiteKey } from '@protected/model/ConstructionSite';
import React, { FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewConceptAssignmentModal } from './NewConceptAssignmentModal';


interface Props {
    anchor: {constructionSite: ConstructionSiteKey}
}

export const CreateAnliegerButton: FunctionComponent<Props> = ({
  anchor,
}) => {
  const [modalOpen, setModalOpen] = React.useState(false)
  const navigate = useNavigate()
  return <Box>
    <Button variant='outlined' sx={{'fontSize': '11px', 'padding': '5px'}} color='secondary' onClick={() => setModalOpen(true)}>
      Neues Anliegerprojekt vergeben
    </Button>
    {modalOpen && <NewConceptAssignmentModal onClose={() => setModalOpen(false)} anliegerUsingAnchor={anchor}
      onSuccess={(detail) => {
        setModalOpen(false); navigate(`/protected/admin/conceptAssignments/${detail.id}`)
      }} />}
  </Box>
}
