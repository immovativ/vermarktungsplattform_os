import { Close } from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, {FunctionComponent } from 'react';
import {formatDate} from '@common/util/DateFormatter';


interface Props {
  onClose: () => void
  data: any
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
    ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
})

function informationText(data: any) {
  if (data[0] == 'constructionField') {
    return 'Sie haben das Baufeld »' + data[2] + '« im Bauabschnitt »' + data[1] + '« ausgewählt.\n' +
      'Hier wird derzeit kein Grundstücke vergeben.\n' +
      data[3];
  } else if (data[0] == 'assignmentInReview') {
    return 'Die Vergabe ' + data[2] + ' wurde am ' + formatDate(data[1]) + ' beendet.\n' +
      ' Der Entscheidungsprozess zur Vergabe läuft derzeit. Sobald dieser abgeschlossen ist, informieren wir Sie hier über das entstehende Projekt.'
  } else if (data[0] == 'assignmentFinished') {
    return 'Dieses Grundstück wurde bereits vergeben. Hier entsteht in Zukunft ein \n' +
      'Mehrfamilienwohnhaus in ökologischer Bauweise mit 30 Wohnungen (Beispielprojektbeschreibung).'
  } else {
    return '';
  }
}

export const ConstructionFieldOnMapModal: FunctionComponent<Props> = ({
  onClose,
  data,
}) => {
  return <Dialog
    open={true}
    fullWidth
    TransitionComponent={Transition}
    maxWidth="md"
    aria-label="Informationen"
    onClose={onClose}
  >
    <DialogTitle sx={{ mb: 2 }}>
      Information
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
      {informationText(data)}
    </DialogContent>
  </Dialog>
}
