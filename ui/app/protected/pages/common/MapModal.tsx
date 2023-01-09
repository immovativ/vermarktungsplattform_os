import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import React, {FunctionComponent } from 'react';

import { FeatureMap } from '@protected/components/map/FeatureMap';
import { Feature } from 'ol';

interface Props {
  onClose: () => void
  feature: Feature[] | Feature
}

export const MapModal: FunctionComponent<Props> = ({
  onClose,
  feature,
}) => {
  return <Dialog
    open={true}
    fullWidth
    maxWidth="lg"
    aria-label="Karte"
    onClose={onClose}
  >
    <DialogTitle>Standort</DialogTitle>
    <DialogContent>
      <Box sx={{width: '100%', height: '500px'}}>
        {Array.isArray(feature) ?
          <FeatureMap features={feature} /> :
          <FeatureMap feature={feature} />
        }
      </Box>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onClose}>Schliessen</Button>
    </DialogActions>
  </Dialog>
}
