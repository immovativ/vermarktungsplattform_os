import {
  Alert,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { AssignmentHeader } from '@protected/pages/common/assignments/AssignmentHeader';
import { TabPanel } from '@protected/pages/common/TabPanel';
import React, { FunctionComponent } from 'react';
import { CreateAnliegerButton } from '../draft/CreateAnliegerButton';
import { renderAttachmentIcon } from '../draft/DraftDetail';
import { QuestionEdit } from '../draft/QuestionEdit';
import { AdminConceptAssignmentDetail, AdminConceptAssignmentDetailWithAttachments } from '../queries/concept-assignment';
import { ReadonlyDetail } from './ReadonlyDetail';
import { UnstartModal } from './UnstartModal';


interface Props {
    detail: AdminConceptAssignmentDetailWithAttachments
    updateFromMutation: (ca: AdminConceptAssignmentDetailWithAttachments) => void
}

export const WaitingAssignmentDetail: FunctionComponent<Props> = (props) => {
  const concept = props.detail.assignment
  const [unstartEnabled, setUnstartEnabled] = React.useState<AdminConceptAssignmentDetail | null>(null)
  const [tabIndex, setTabIndex] = React.useState<0 | 1 | 2>(0)

  return <>
    {unstartEnabled && <UnstartModal a={concept}
      onCancel={() => setUnstartEnabled(null)}
      updateFromMutation={(a) => {
        props.updateFromMutation(a); setUnstartEnabled(null)
      }}
    />}
    <AssignmentHeader
      concept={concept}
      actionBar={<Stack direction='row' spacing={1}>
        {concept.conceptAssignmentType === 'ANCHOR' && <CreateAnliegerButton anchor={{
          constructionSite: {
            constructionAreaId: concept.parcels[0].constructionAreaId,
            constructionSiteId: concept.parcels[0].constructionSiteId,
          },
        }} />}
        <Button
          onClick={() => setUnstartEnabled(concept)}
          variant='outlined' color="secondary">Vergabeverfahren abbrechen</Button>
      </Stack>
      }
    />
    <Tabs value={tabIndex} onChange={(_, idx) => setTabIndex(idx)} >
      <Tab label="Daten" />
      <Tab label="Unterlagen" />
      <Tab label="Bewerbungsfragen" />
    </Tabs>
    <TabPanel value={tabIndex} index={0}>
      <Stack direction='column' spacing={1}>
        <ReadonlyDetail detail={props.detail} />
      </Stack>
    </TabPanel>
    <TabPanel value={tabIndex} index={1}>
      <Stack direction='column' spacing={1}>
        <Typography variant='h6'>Hochgeladene Unterlagen</Typography>
        <Typography variant='caption' color='text.secondary'>
          Diese Unterlagen werden mit dem Start der Vergabe öffentlich zugänglich.
        </Typography>
        <List dense>
          {props.detail.attachments.length === 0 && <Alert severity='info' variant='outlined'>Es sind keine Anhänge vorhanden.</Alert>}
          {props.detail.attachments.map((attachment) => <ListItem key={attachment.id}>
            <ListItemButton component="a" href={`/api/admin/concept-assignment/${concept.id}/attachment/${attachment.id}`} target='_blank'>
              <ListItemIcon>
                {renderAttachmentIcon(attachment.contentType)}
              </ListItemIcon>
              <ListItemText primary={attachment.name} />
            </ListItemButton>
          </ListItem>) }
        </List>
      </Stack>
    </TabPanel>
    <TabPanel value={tabIndex} index={2}>
      <QuestionEdit
        readonly
        updateFromMutation={(noop) => noop}
        detail={props.detail}
      />
    </TabPanel>
  </>
}
