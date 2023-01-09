
import {
  Alert, Divider,
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
import { ReadonlyDetail } from '../active-assignments/ReadonlyDetail';
import { ReviewCandidaturesList } from '../candidature/ReviewCandidaturesList';
import { renderAttachmentIcon } from '../draft/DraftDetail';
import { QuestionEdit } from '../draft/QuestionEdit';
import { AdminConceptAssignmentDetailWithAttachments } from '../queries/concept-assignment';
import {FolderZip} from '@mui/icons-material';
import { CreateAnliegerButton } from '../draft/CreateAnliegerButton';


interface Props {
    detail: AdminConceptAssignmentDetailWithAttachments
}

export const GrantedAssignment: FunctionComponent<Props> = (props) => {
  const concept = props.detail.assignment
  const [tabIndex, setTabIndex] = React.useState<0 | 1 | 2 | 3 | 4>(0)

  return <>
    <AssignmentHeader
      concept={concept}

      actionBar={<Stack direction='row' spacing={1}>
        {concept.conceptAssignmentType === 'ANCHOR' && <CreateAnliegerButton anchor={{
          constructionSite: {
            constructionAreaId: concept.parcels[0].constructionAreaId,
            constructionSiteId: concept.parcels[0].constructionSiteId,
          },
        }} />}
      </Stack>
      }
    />
    <Tabs value={tabIndex} onChange={(_, idx) => setTabIndex(idx)} >
      <Tab label="Zuschlag-Gewinner:in" />
      <Tab label="Abgelehnte Bewerbungen" />
      <Tab label="Daten" />
      <Tab label="Unterlagen" />
      <Tab label="Bewerbungsfragen" />
    </Tabs>
    <TabPanel value={tabIndex} index={0}>
      <Stack direction='column' spacing={1}>
        <ReviewCandidaturesList candidatures={props.detail.candidatures.filter((c) => c.candidature.state === 'ACCEPTED')} />
      </Stack>
    </TabPanel>
    <TabPanel value={tabIndex} index={1}>
      <Stack direction='column' spacing={1}>
        <ReviewCandidaturesList candidatures={props.detail.candidatures.filter((c) => c.candidature.state !== 'ACCEPTED')} />
      </Stack>
    </TabPanel>
    <TabPanel value={tabIndex} index={2}>
      <Stack direction='column' spacing={1}>
        <ReadonlyDetail detail={props.detail} />
      </Stack>
    </TabPanel>
    <TabPanel value={tabIndex} index={3}>
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
          {props.detail.attachments.length > 0 &&
            <>
              <Divider />
              <ListItem>
                <ListItemButton component="a" href={`/api/admin/concept-assignment/${concept.id}/attachment/zip`}>
                  <ListItemIcon>
                    <FolderZip />
                  </ListItemIcon>
                  <ListItemText primary="Alle Anhänge runterladen" />
                </ListItemButton>
              </ListItem>
            </>
          }
        </List>
      </Stack>
    </TabPanel>
    <TabPanel value={tabIndex} index={4}>
      <QuestionEdit
        readonly
        updateFromMutation={(noop) => noop}
        detail={props.detail}
      />
    </TabPanel>
  </>
}
