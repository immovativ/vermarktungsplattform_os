import {
  Alert,
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
import { TabPanel } from '@protected/pages/common/TabPanel';
import React, { FunctionComponent } from 'react';
import { renderAttachmentIcon } from '../draft/DraftDetail';
import { QuestionEdit } from '../draft/QuestionEdit';
import { AdminConceptAssignmentDetailWithAttachments } from '../queries/concept-assignment';
import { ReadonlyDetail } from '../active-assignments/ReadonlyDetail';
import { ReviewCandidaturesList } from '../candidature/ReviewCandidaturesList';
import { AssignmentHeader } from '@protected/pages/common/assignments/AssignmentHeader';


interface Props {
    detail: AdminConceptAssignmentDetailWithAttachments
}

export const AbortedDetail: FunctionComponent<Props> = (props) => {
  const concept = props.detail.assignment
  const [tabIndex, setTabIndex] = React.useState<0 | 1 | 2 | 3>(0)

  return <>
    <AssignmentHeader
      concept={concept}
    />
    <Tabs value={tabIndex} onChange={(_, idx) => setTabIndex(idx)} >
      <Tab label="Bewerbungen" />
      <Tab label="Daten" />
      <Tab label="Unterlagen" />
      <Tab label="Bewerbungsfragen" />
    </Tabs>
    <TabPanel value={tabIndex} index={0}>
      <Stack direction='column' spacing={1}>
        <ReviewCandidaturesList candidatures={props.detail.candidatures} />
      </Stack>
    </TabPanel>
    <TabPanel value={tabIndex} index={1}>
      <Stack direction='column' spacing={1}>
        <ReadonlyDetail detail={props.detail} />
      </Stack>
    </TabPanel>
    <TabPanel value={tabIndex} index={2}>
      <Stack direction='column' spacing={1}>
        <Typography variant='h6'>Hochgeladene Unterlagen</Typography>
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
    <TabPanel value={tabIndex} index={3}>
      <QuestionEdit
        readonly
        updateFromMutation={(noop) => noop}
        detail={props.detail}
      />
    </TabPanel>
  </>
}
