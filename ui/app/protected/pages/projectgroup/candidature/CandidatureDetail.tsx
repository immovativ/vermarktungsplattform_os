import {
  Alert, Box, Button, Card, CardActions, CardContent, CardHeader, Chip, Divider, Grid, IconButton, List,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Stack, Tab, Tabs, Tooltip, Typography,
} from '@mui/material';
import React, {FunctionComponent, useMemo} from 'react';
import { useQueryClient } from 'react-query';
import { DateTime } from 'luxon';
import { useNavigate } from 'react-router-dom';
import { AdminCandidatureView, UserData } from '../queries/candidature';
import { BuildingTypeTranslations } from '../queries/concept-assignment';
import { renderAttachmentIcon } from '../draft/DraftDetail';
import {
  ArrowLeft,
  ArrowRight,
  CheckOutlined,
  DoDisturbAltOutlined,
  FolderZip,
  Map,
  MoreVert,
} from '@mui/icons-material';
import { QuestionInputs } from '@protected/pages/common/inputs/QuestionInputs';
import { MapModal } from '@protected/pages/common/MapModal';
import {CandidatureStateTranslations} from '@protected/model/candidature/Candidature';
import { RejectModal } from './RejectModal';
import { GrantModal } from './GrantModal';
import { useProvideBreadcrumb } from '@common/navigation/breadcrumb/useBreadcrumb';
import { CommentDisplay } from './CommentDisplay';
import {SalutationTranslations} from '@protected/pages/common/profile/queries/profile';
import { ChatBox } from '@common/component/chat/ChatBox';
import { TabPanel } from '@protected/pages/common/TabPanel';
import { CandidatePicker } from './CandidatePicker';
import { parcelsToFeatures } from '@protected/model/Parcel';

export function getUsername(u: UserData | undefined): string | null {
  if (!u) {
    return null
  }

  if (u.company) {
    return u.company
  } else {
    return `${u.firstName} ${u.lastName}`
  }
}

export const CandidatureDetail: FunctionComponent<{v: AdminCandidatureView, candidatureId: string}> = (props) => {
  const candidatureId = props.candidatureId
  const view = props.v

  const navigate = useNavigate()

  const username = getUsername(view.user)
  useProvideBreadcrumb(
      'candidature-name',
      {name: username ? `Bewerbung ${username}` : 'Bewerbung'},
  )

  useProvideBreadcrumb(
      'assignment-name',
      {name: view.details.conceptAssignmentWithAttachments.assignment.name},
  )

  const queryClient = useQueryClient()
  const [mapOpen, setMapOpen] = React.useState(false)
  const [tabIndex, setTabIndex] = React.useState(0)
  const [rejectModalOpen, setRejectModalOpen] = React.useState<AdminCandidatureView | null>(null)
  const [grantModalOpen, setGrantModalOpen] = React.useState<AdminCandidatureView | null>(null)
  const [showMoreMenu, setShowMoreMenu] = React.useState(false)

  const showMoreEl = React.useRef<HTMLButtonElement>(null)

  const concept = view.details.conceptAssignmentWithAttachments.assignment
  const c = view.details.candidatureWithAttachments
  const candidatureState = c.candidature.state
  const u = view.user

  const allCandidatures = view.details.conceptAssignmentWithAttachments.candidatures
  const currentIndex = allCandidatures.findIndex((c) => c.candidature.id === candidatureId)
  const leftIndex = (currentIndex - 1) < 0 ? allCandidatures.length - 1 : currentIndex - 1
  const rightIndex = (currentIndex + 1) >= allCandidatures.length ? 0 : currentIndex + 1

  const prevLink = `/protected/admin/conceptAssignments/${concept.id}/candidature/${allCandidatures[leftIndex].candidature.id}`
  const nextLink = `/protected/admin/conceptAssignments/${concept.id}/candidature/${allCandidatures[rightIndex].candidature.id}`

  const features = useMemo(() =>
    parcelsToFeatures(concept.parcels),
  [JSON.stringify(concept.parcels)],
  )

  return <>
    <div style={{position: 'sticky', height: '0px', top: 'calc(100% - 85px)', zIndex: 99}}>
      <Stack direction="column">
        <Paper sx={{p: 1}}>
          <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" justifyContent='center' alignContent='center' spacing={2}>
              <Tooltip title="Vorherige Bewerbung">
                <IconButton
                  sx={{alignSelf: 'center'}}
                  onClick={() => navigate(prevLink)}
                >
                  <ArrowLeft />
                </IconButton>
              </Tooltip>
              <CandidatePicker
                activeCandidate={candidatureId}
                candidates={allCandidatures}
                updateFromMutation={(d) => {
                  queryClient.setQueryData(['candidature-detail', candidatureId], d)
                }}
                onSelectCandidate={(c) => navigate(
                    `/protected/admin/conceptAssignments/${concept.id}/candidature/${c.candidature.id}`,
                )}
              />
              <Tooltip title="Nächste Bewerbung">
                <IconButton
                  sx={{alignSelf: 'center'}}
                  onClick={() => navigate(nextLink)}
                >
                  <ArrowRight />
                </IconButton>
              </Tooltip>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" alignSelf="center">
              <CommentDisplay
                candidatureId={view.details.candidatureWithAttachments.candidature.id}
                comment={view.comment}
                updateFromMutation={(d) => {
                  queryClient.setQueryData(['candidature-detail', candidatureId], d)
                }}
              />
              <Divider orientation="vertical" flexItem />
              <Box>
                <ChatBox withLabel for='admin' candidatureId={c.candidature.id} displayName={`${view.user.firstName} ${view.user.lastName}`} />
              </Box>
              {candidatureState === 'SUBMITTED' && concept.state === 'REVIEW' && <>
                <Menu
                  open={showMoreMenu}
                  anchorEl={showMoreEl.current}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  onClose={() => setShowMoreMenu(false)}
                >
                  <MenuItem
                    onClick={() => setGrantModalOpen(view)}
                  >
                    <ListItemIcon>
                      <CheckOutlined color="success"/>
                    </ListItemIcon>
                    <ListItemText>
                    Zuschlag erteilen
                    </ListItemText>
                  </MenuItem>
                  <Divider />
                  <MenuItem
                    onClick={() => setRejectModalOpen(view)}
                  >
                    <ListItemIcon>
                      <DoDisturbAltOutlined color="error" />
                    </ListItemIcon>
                    <ListItemText>
                    Bewerbung ablehnen
                    </ListItemText>
                  </MenuItem>
                </Menu>
                <Divider orientation="vertical" flexItem />
                <IconButton
                  color="secondary"
                  onClick={() => setShowMoreMenu(true)}
                  ref={showMoreEl}
                >
                  <MoreVert />
                </IconButton>
              </>}
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </div>
    <Stack direction="column" spacing={2} sx={{position: 'relative', minHeight: '95%'}}>
      <Grid container display="grid" gridTemplateColumns="3fr 1fr" columnGap={1}>
        <Card variant='outlined'>
          <CardContent>
            <Stack direction="row">
              <Stack direction="column" flexGrow="1">
                <Grid container direction="row" justifyContent="space-between">
                  <Grid item>
                    <Stack spacing={1} direction="column">
                      <Typography variant="h6" color="text.primary">
                        Bewerbung von {u.company || `${u.firstName} ${u.lastName}`}&nbsp;
                        {candidatureState === 'REJECTED' && <Chip color='error' label={CandidatureStateTranslations[candidatureState]} />}
                        {candidatureState === 'ACCEPTED' && <Chip color='success' label={CandidatureStateTranslations[candidatureState]} />}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Gebäudetypologie: {BuildingTypeTranslations[concept.details.buildingType]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bewerbung eingegangen: {DateTime.fromISO(c.candidature.updatedAt).setLocale('de').toLocaleString(DateTime.DATETIME_MED)}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        onClick={() => setMapOpen(true)}><Map /></IconButton>
                    </Stack>
                  </Grid>
                </Grid>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
        <Card variant='outlined'>
          <CardHeader title='Bewerber:in'>
          </CardHeader>
          <CardContent>
            <Typography variant='caption'>{SalutationTranslations[u.salutation]}</Typography>
            <Typography variant='body1'> {u.firstName} {u.lastName}</Typography>
            {u.company && <Typography variant='body1'> {u.company}</Typography>}
          </CardContent>
          <CardActions>
            <Button onClick={() => navigate(`profile/${view.user.userId}`)}>Zum Profil</Button>
          </CardActions>
        </Card>
      </Grid>

      <Tabs value={tabIndex} onChange={(_, idx) => setTabIndex(idx)} >
        <Tab label="Bewerbungsangaben" />
        <Tab label="Bewerbungsunterlagen" />
      </Tabs>
      <TabPanel value={tabIndex} index={0}>
        <Stack direction="column" spacing={1}>
          <Typography variant="body1" sx={{whiteSpace: 'pre-line'}}>
            {c.candidature.description}
          </Typography>
          <Divider />
          <QuestionInputs
            candidature={view.details}
            questions={concept.questions}
            answers={c.candidature.answers}
            readonly={true}
          />
        </Stack>
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <List dense>
          {c.attachments.length === 0 && <Alert severity='info' variant='outlined'>Es sind keine Anhänge vorhanden.</Alert>}
          {c.attachments.map((attachment) => <ListItem key={attachment.id}>
            <ListItemButton component="a"
              href={`/api/candidate/candidatures/${c.candidature.id}/attachments/${attachment.id}`} target='_blank'>
              <ListItemIcon>
                {renderAttachmentIcon(attachment.contentType)}
              </ListItemIcon>
              <ListItemText primary={attachment.name} />
            </ListItemButton>
          </ListItem>) }
          {c.attachments.length > 0 &&
            <>
              <Divider />
              <ListItem>
                <ListItemButton component="a" href={`/api/admin/candidatures/${c.candidature.id}/attachments/zip`}>
                  <ListItemIcon>
                    <FolderZip />
                  </ListItemIcon>
                  <ListItemText primary="Alle Anhänge runterladen" />
                </ListItemButton>
              </ListItem>
            </>
          }
        </List>
      </TabPanel>
      <Box sx={{pb: 8}} />


      {mapOpen && <MapModal onClose={() => setMapOpen(false)} feature={features} />}
      {rejectModalOpen && <RejectModal
        onCancel={() => setRejectModalOpen(null)}
        d={rejectModalOpen}
        updateFromMutation={(d) => {
          queryClient.setQueryData(['candidature-detail', candidatureId], d); setRejectModalOpen(null)
        }} />}
      {grantModalOpen && <GrantModal
        onCancel={() => setGrantModalOpen(null)}
        d={grantModalOpen}
        updateFromMutation={(d) => {
          queryClient.setQueryData(['candidature-detail', candidatureId], d); setGrantModalOpen(null)
        }} />}
    </Stack>
  </>
}
