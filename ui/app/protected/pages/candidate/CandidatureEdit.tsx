import React, {FunctionComponent, useEffect, useMemo} from 'react';
import {focusManager} from 'react-query';
import {
  Alert, Box, Button, ButtonGroup,
  Card,
  CardContent,
  Divider,
  FormGroup,
  Grid, ListItemText, Menu, MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  deleteAttachment,
  deleteCandidature,
  editCandidature,
  submitCandidature,
  uploadAttachment,
} from '@protected/pages/candidate/queries';
import {
  CandidatureQuestions,
} from '@protected/pages/projectgroup/queries/concept-assignment';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {
  CandidatureAndConceptAssignmentWithAttachments,
  EditCandidatureRequest,
} from '@protected/model/candidature/Candidature';
import {LoadingButton} from '@common/component/LoadingButton';
import {DropzoneArea} from 'mui-file-dropzone';
import {QuestionInputs} from '@protected/pages/common/inputs/QuestionInputs';
import {useProvideBreadcrumb} from '@common/navigation/breadcrumb/useBreadcrumb';
import {MapModal} from '@protected/pages/common/MapModal';
import {AttachmentReadonlyList} from '@protected/pages/common/attachments/AttachmentReadonlyList';
import {AttachmentList} from '@protected/pages/common/attachments/AttachmentList';
import {CandidatureSubmissionModal} from '@protected/pages/candidate/CandidatureSubmissionModal';
import {CandidatureCopyModal} from '@protected/pages/candidate/CandidatureCopyModal';
import { CandidatureAssignmentHeader } from '../common/assignments/CandidatureAssignmentHeader';
import {MoreVert} from '@mui/icons-material';
import { parcelsToFeatures } from '@protected/model/Parcel';
import { ConstructionSiteDetailStats } from '@common/component/construction-site/ConstructionSiteDetailStats';
import { PoorMansStatCard } from '@common/component/StatCard';
import { CandidatureDeleteModal } from './CandidatureDeleteModal';
import { useNavigate } from 'react-router-dom';

function renderDetail(text: string, detail: string | number | null | undefined): JSX.Element {
  return <PoorMansStatCard
    label={text}
    value={detail?.toString() || ''}
  />
}

interface Props {
  delegateId?: string | undefined
  candidature: CandidatureAndConceptAssignmentWithAttachments
  onChange: () => void
}

function getFormErrors(values: EditCandidatureRequest, questions: CandidatureQuestions | undefined): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  if (values.description.trim().length === 0) {
    errors.description = 'Bitte geben Sie eine Beschreibung ein.'
  }

  if (questions) {
    const required = questions.questions.filter((question) => question.required)

    for (const question of required) {
      if (!values.answers[question.id]) {
        errors[question.id] = 'Bitte beantworten Sie diese Frage.'
      }
    }
  }

  return errors
}

interface FormValues {
  description: string
  answers: { [key: string]: string }
}

function filterEmptyAnswers(formValues: FormValues): FormValues {
  const answers: { [key: string]: string } = {};

  for (const key in formValues.answers) {
    if (formValues.answers[key] !== '') {
      answers[key] = formValues.answers[key];
    }
  }

  return {
    ...formValues,
    answers,
  }
}

export const CandidatureEdit: FunctionComponent<Props> = (props) => {
  const candidatureWithAttachments = props.candidature.candidatureWithAttachments;
  const candidature = candidatureWithAttachments.candidature
  const conceptAssignmentWithAttachments = props.candidature.conceptAssignmentWithAttachments
  const conceptAssignment = conceptAssignmentWithAttachments.assignment

  const navigate = useNavigate()

  useProvideBreadcrumb(
      'assignment-name',
      {name: conceptAssignment.name},
  )

  const editCandidatureMutation = useBetterMutation(
      (payload: FormValues) => editCandidature(
          {description: payload.description, answers: payload.answers},
          candidature.id,
          props.delegateId ?? null,
      ),
      {
        onSuccess: () => {
          props.onChange()
          setIsDirty(false)
        },
      })

  const uploadAttachmentMutation = useBetterMutation((payload: File[]) => uploadAttachment(
      candidature.id,
      payload[0],
      props.delegateId ?? null,
  ),
  {
    onSuccess: () => {
      props.onChange()
      focusManager.setFocused(undefined)
    },
  },
  )

  const deleteAttachmentMutation = useBetterMutation((attachmentId: string) => deleteAttachment(
      candidature.id,
      attachmentId,
      props.delegateId ?? null,
  ),
  {
    onSuccess: () => {
      props.onChange()
    },
  },
  )


  const submitCandidatureMutation = useBetterMutation(() => submitCandidature(
      candidature.id,
      props.delegateId ?? null,
  ), {
    onSuccess: () => {
      props.onChange()
    },
  })

  const deleteCandidatureMutation = useBetterMutation(() => deleteCandidature(
      candidature.id,
      props.delegateId ?? null,
  ), {
    onSuccess: () => {
      navigate('/protected/candidate/candidatures')
    },
  })

  const [showMapModal, setShowMapModal] = React.useState(false)
  const [showSubmissionModal, setShowSubmissionModal] = React.useState(false)
  const [showCopyModal, setShowCopyModal] = React.useState(false)
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [formValues, setFormValues] = React.useState<FormValues>({
    description: candidature.description,
    answers: candidature.answers,
  })

  const [isDirty, setIsDirty] = React.useState(false)

  const pristineFormValues = useMemo(() => {
    return {
      description: candidature.description,
      answers: candidature.answers,
    }
  }, [candidature.description, JSON.stringify(candidature.answers)])

  useEffect(() => {
    setIsDirty(JSON.stringify(formValues) !== JSON.stringify(pristineFormValues))
  }, [JSON.stringify(formValues)])

  useEffect(() => {
    setFormValues({
      description: candidature.description,
      answers: candidature.answers,
    })
  }, [candidature.description, JSON.stringify(candidature.answers)])

  const formErrors: { [key: string]: string } = useMemo(
      () => getFormErrors({
        description: candidature.description,
        answers: candidature.answers,
      }, conceptAssignment.questions),
      [JSON.stringify(props.candidature)],
  )

  const features = useMemo(() => parcelsToFeatures(conceptAssignment.parcels),
      [JSON.stringify(conceptAssignment.parcels)],
  )

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return <>
    <Stack direction="column" spacing={2} mb={3}>
      <Box sx={{position: 'sticky', top: '0', zIndex: 99}}
        boxShadow={(t) => `0 10px 10px ${t.palette.common.white}`} >
        <CandidatureAssignmentHeader
          concept={props.candidature.conceptAssignmentWithAttachments}
          formErrors={formErrors}
          actionBar={
            <ButtonGroup variant="outlined">
              <LoadingButton
                disabled={!isDirty}
                loading={editCandidatureMutation.isLoading}
                onClick={() => editCandidatureMutation.mutate(formValues)}>
                  Speichern
              </LoadingButton>

              <Button size="small" onClick={handleClick}>
                <MoreVert />
              </Button>
              <Menu
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorEl={anchorEl}>
                <MenuItem onClick={() => {
                  setShowSubmissionModal(true)
                  handleClose()
                }}
                disabled={Object.keys(formErrors).length > 0}>
                  <ListItemText>Bewerbung einreichen</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                  setShowCopyModal(true)
                  handleClose()
                }}>
                  <ListItemText>Werte übernehmen</ListItemText>
                </MenuItem>
                {props.candidature.candidatureWithAttachments.candidature.state === 'DRAFT' && <>
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      setShowDeleteModal(true)
                      handleClose()
                    }}
                  >
                    <ListItemText>Bewerbung löschen</ListItemText>
                  </MenuItem>
                </>
                }
              </Menu>
            </ButtonGroup>
          }
        />
      </Box>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={9}>
              <ConstructionSiteDetailStats
                constructionSiteKey={conceptAssignment.parcels[0]}
              />
              <Grid
                sx={{mt: 2}}
                display="grid"
                gridTemplateColumns="1fr 1fr"
                gap={2}
              >
                {renderDetail('Zulässige Geschosse', conceptAssignment.details?.allowedFloors)}
                {renderDetail('Zulässige Gebäudehöhe (in Meter)',
                    conceptAssignment.details?.allowedBuildingHeightMeters?.toLocaleString('de-DE', {maximumFractionDigits: 2}))}
              </Grid>
            </Grid>
            <Grid item xs={3}>
              <Stack direction="column" spacing={1}>
                <Typography variant="subtitle1">Vergabe-Dokumente</Typography>

                <AttachmentReadonlyList
                  attachments={conceptAssignmentWithAttachments.attachments}
                  baseDownloadUrl={`/api/assignment/${conceptAssignment.id}/attachment`}
                />
              </Stack>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="column" spacing={1}>
              {conceptAssignment.details.energyText && <Typography variant="h6">Besondere Vorgaben</Typography>}
              {conceptAssignment.details.energyText && <Stack direction="column">
                <Typography variant='caption'>Energetische Vorgaben</Typography>
                <Typography variant='body2' sx={{whiteSpace: 'pre-line'}}>{conceptAssignment.details.energyText}</Typography>
              </Stack>}
            </Stack>
          </Grid>
        </CardContent>
      </Card>

      {submitCandidatureMutation.isError &&
        <Alert
          severity={submitCandidatureMutation.error.status === 412 ? 'warning' : 'error'}
        >
          {submitCandidatureMutation.error.status === 412 ?
            'Bitte füllen Sie die Bewerbung komplett aus. Die fehlenden Felder sind rot markiert.' :
            submitCandidatureMutation.error.message}
        </Alert>}

      <Card>
        <CardContent>
          <Stack direction="column" spacing={2}>
            <FormGroup>
              <TextField
                label="Kurzbeschreibung Ihres Bauvorhabens"
                name="description"
                multiline
                rows={4}
                value={formValues.description}
                onChange={(e) => setFormValues({...formValues, description: e.target.value})}
              />
            </FormGroup>

            <QuestionInputs
              candidature={props.candidature}
              questions={conceptAssignment.questions}
              answers={formValues.answers}
              onChange={(answers, submit) => {
                const newFormValues = filterEmptyAnswers({...formValues, answers})

                if (submit) {
                  setFormValues(newFormValues)
                  editCandidatureMutation.mutate(newFormValues)
                } else {
                  setFormValues(newFormValues)
                }
              }}
              readonly={false}
            />

            <AttachmentList
              attachments={candidatureWithAttachments.attachments}
              deleteAttachment={deleteAttachmentMutation.mutate}
              baseDownloadUrl={`/api/candidate/candidatures/${candidature.id}/attachments`}
            />

            <DropzoneArea
              showPreviews={false}
              showPreviewsInDropzone={false}
              getFileAddedMessage={(file) => `${file} wird hochgeladen`}
              getDropRejectMessage={(file) => `${file.name} wurde abgelehnt. Bitte laden Sie Anhänge unter 15MB hoch.`}
              getFileLimitExceedMessage={() => `Datei ist zu groß (bitte <15MB)`}
              dropzoneText="Dateien hierherziehen oder zum Auswählen klicken"
              filesLimit={1}
              maxFileSize={15000000}
              fileObjects={undefined}
              onChange={(files) => {
                focusManager.setFocused(false)
                files.length > 0 && uploadAttachmentMutation.mutate(files)
              }}/>

            {editCandidatureMutation.isError &&
              <Alert severity="error"
                onClose={editCandidatureMutation.reset}>{editCandidatureMutation.error.message}</Alert>
            }

            {uploadAttachmentMutation.isError &&
              <Alert severity="error"
                onClose={uploadAttachmentMutation.reset}>{uploadAttachmentMutation.error.message}</Alert>
            }
          </Stack>
        </CardContent>
      </Card>
      <Card sx={{p: 2}}>
        <Stack direction="row-reverse">
          <Button
            variant="contained"
            disabled={Object.keys(formErrors).length > 0}
            onClick={() => {
              setShowSubmissionModal(true)
              handleClose()
            }}
          >
            Bewerbung einreichen
          </Button>
        </Stack>
      </Card>
    </Stack>

    {showMapModal &&
      <MapModal
        onClose={() => setShowMapModal(false)}
        feature={features}
      />
    }
    {showSubmissionModal &&
      <CandidatureSubmissionModal
        onSuccess={() => {
          setShowSubmissionModal(false)
          submitCandidatureMutation.mutate({})
        }}
        onClose={() => setShowSubmissionModal(false)}
        state={conceptAssignment.state}
      />
    }
    {showCopyModal &&
      <CandidatureCopyModal
        candidatureId={candidature.id}
        onSuccess={() => {
          props.onChange()
          setShowCopyModal(false)
        }}
        onClose={() => setShowCopyModal(false)}
      />
    }

    {showDeleteModal &&
      <CandidatureDeleteModal
        onSuccess={() => {
          deleteCandidatureMutation.mutate({})
          setShowDeleteModal(false)
        }}
        onClose={() => setShowDeleteModal(false)}
      />
    }
  </>
}
