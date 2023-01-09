import { Close } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { AssignmentHeader } from '@protected/pages/common/assignments/AssignmentHeader';
import React, {FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminConceptAssignmentListResult } from '../queries/concept-assignment';

interface Props {
  onClose: () => void
  data: AdminConceptAssignmentListResult
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
    ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
})

export const AssignmentOnMapModal: FunctionComponent<Props> = ({
  onClose,
  data,
}) => {
  const navigate = useNavigate()

  return <Dialog
    open={true}
    fullWidth
    TransitionComponent={Transition}
    maxWidth="xl"
    aria-label="Standortdetails"
    onClose={onClose}
  >
    <DialogTitle sx={{ mb: 2 }}>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <Close />
      </IconButton>
    </DialogTitle>
    <DialogContent>
      <AssignmentHeader
        concept={data.assignment}
        actionBar={
          <Button variant="outlined" color="primary"
            onClick={() => navigate(`/protected/admin/conceptAssignments/${data.assignment.id}`)}>Zum Verfahren</Button>
        }
      />
    </DialogContent>
  </Dialog>
}
