import {
  Alert,
  Button, Divider,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { TabPanel } from '@protected/pages/common/TabPanel';
import React, { FunctionComponent, useState } from 'react';
import { renderAttachmentIcon } from '../draft/DraftDetail';
import { QuestionEdit } from '../draft/QuestionEdit';
import { AdminConceptAssignmentDetailWithAttachments } from '../queries/concept-assignment';
import { CandidaturesList } from '../candidature/CandidaturesList';
import { ReadonlyDetail } from './ReadonlyDetail';
import { StopModal } from './StopModal';
import { AssignmentHeader } from '@protected/pages/common/assignments/AssignmentHeader';
import {FolderZip} from '@mui/icons-material';
import { CreateDelegatedCandidatureModal } from './CreateDelegatedCandidatureModal';
import { CreateAnliegerButton } from '../draft/CreateAnliegerButton';
import { useNavigate } from 'react-router-dom';


interface Props {
    detail: AdminConceptAssignmentDetailWithAttachments
    updateFromMutation: (ca: AdminConceptAssignmentDetailWithAttachments) => void
}

export const ActiveAssignmentDetail: FunctionComponent<Props> = (props) => {
  const concept = props.detail.assignment

  const navigate = useNavigate()

  const [showDelegatedCandidatureModal, setShowDelegatedCandidatureModal] = useState(false)
  const [tabIndex, setTabIndex] = React.useState<0 | 1 | 2>(0)

  const [stopOpen, setStopOpen] = React.useState<AdminConceptAssignmentDetailWithAttachments | null>(null)

  return <>
    <AssignmentHeader
      concept={concept}
      actionBar={<Stack direction='row' spacing={1}>
        {concept.conceptAssignmentType === 'ANCHOR' && <CreateAnliegerButton anchor={{constructionSite: {
          constructionAreaId: concept.parcels[0].constructionAreaId,
          constructionSiteId: concept.parcels[0].constructionSiteId,
        }}} />}
        <Button
          variant="outlined"
          color="error"
          onClick={() => setStopOpen(props.detail)}
          title="Hinweis: Dies ist eine Testfunktionalität für den MVP"
        >DEV: beenden</Button>
      </Stack>
      }
    />
    <Tabs value={tabIndex} onChange={(_, idx) => setTabIndex(idx)} >
      <Tab label="Bewerbungen" />
      <Tab label="Daten" />
      <Tab label="Unterlagen" />
      <Tab label="Bewerbungsfragen" />
    </Tabs>
    <TabPanel value={tabIndex} index={0} sx={{px: 0, py: 1}}>
      <Grid container display="grid" gridTemplateColumns="3fr 1fr">
        <Grid item>
          <CandidaturesList candidatures={props.detail.candidatures} />
        </Grid>
        <Grid item>
          <Paper sx={{p: 1}}>
            <Button
              fullWidth
              onClick={() => setShowDelegatedCandidatureModal(true)}
            >
              Bewerbung erfassen
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </TabPanel>
    <TabPanel value={tabIndex} index={1}>
      <Stack direction='column' spacing={1}>
        <ReadonlyDetail detail={props.detail} />
      </Stack>
    </TabPanel>
    <TabPanel value={tabIndex} index={2}>
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
    <TabPanel value={tabIndex} index={3}>
      <QuestionEdit
        readonly
        updateFromMutation={(noop) => noop}
        detail={props.detail}
      />
    </TabPanel>
    {stopOpen && <StopModal a={concept}
      onCancel={() => setStopOpen(null)}
      updateFromMutation={(a) => {
        props.updateFromMutation(a); setStopOpen(null)
      }} />}
    {showDelegatedCandidatureModal &&
        <CreateDelegatedCandidatureModal
          assignmentId={props.detail.assignment.id}
          onClose={() => setShowDelegatedCandidatureModal(false)}
          onCandidatureCreated={(c) => navigate(`candidature/${c.id}/edit`)}
        />
    }
  </>
}
