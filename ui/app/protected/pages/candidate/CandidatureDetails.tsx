import React, {FunctionComponent, useMemo} from 'react';
import {
  Alert, Button, Card, CardContent, CardMedia, Grid, Stack, Typography,
} from '@mui/material';
import { BuildingTypeTranslations} from '@protected/pages/projectgroup/queries/concept-assignment';
import {formatDate} from '@common/util/DateFormatter';
import {QuestionInputs} from '@protected/pages/common/inputs/QuestionInputs';
import {FeatureMap} from '@protected/components/map/FeatureMap';
import {Box} from '@mui/system';
import {useProvideBreadcrumb} from '@common/navigation/breadcrumb/useBreadcrumb';
import {
  CandidatureAndConceptAssignmentWithAttachments, CandidatureStateTranslations,
} from '@protected/model/candidature/Candidature';
import {AttachmentReadonlyList} from '@protected/pages/common/attachments/AttachmentReadonlyList';
import { ChatBox } from '@common/component/chat/ChatBox';
import { parcelsToFeatures } from '@protected/model/Parcel';
import {CandidatureRevokeModal} from '@protected/pages/candidate/CandidatureRevokeModal';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {revokeCandidature} from '@protected/pages/candidate/queries';

interface Props {
  candidature: CandidatureAndConceptAssignmentWithAttachments
  onChange: () => void
}

export const CandidatureDetails: FunctionComponent<Props> = (props) => {
  const candidatureWithAttachments = props.candidature.candidatureWithAttachments;
  const candidature = candidatureWithAttachments.candidature
  const conceptAssignmentWithAttachments = props.candidature.conceptAssignmentWithAttachments
  const conceptAssignment = conceptAssignmentWithAttachments.assignment

  const [showRevokeModal, setShowRevokeModal] = React.useState(false)

  const submitRevokeMutation = useBetterMutation(() => revokeCandidature(
      candidature.id,
      null,
  ), {
    onSuccess: () => {
      props.onChange()
    },
  })

  const features = useMemo(
      () => parcelsToFeatures(conceptAssignment.parcels),
      [JSON.stringify(conceptAssignment.parcels)],
  )

  useProvideBreadcrumb(
      'assignment-name',
      {name: conceptAssignment.name},
  )

  return <Stack direction="column" spacing={2}>

    {candidature.state === 'ACCEPTED' &&
      <Alert severity="success" variant="filled">
        Herzlichen Grlückwunsch, Sie haben den Zuschlag für Ihre Bewerbung erhalten.
        Sie werden in Kürze kontaktiert, um weitere Einzelheiten abzustimmen.
      </Alert>
    }

    {candidature.state === 'REJECTED' &&
      <Alert severity="error" variant="filled">
        Leider konnte Ihre Bewerbung in diesem Vergabeverfahren nicht berücksichtigt werden.
        Gerne steht es Ihnen frei, sich auf weitere Vergabeverfahren zu bewerben.
        Sollte Ihr Konzept zu einem weiteren Baufeld passen, so kommen wir auch gerne direkt auf Sie zu.
      </Alert>
    }

    <Card>
      <CardMedia>
        <Box sx={{width: '100%', height: '300px'}}>
          <FeatureMap features={features}/>
        </Box>
      </CardMedia>
      <CardContent>
        <Grid container columnSpacing={2}>
          <Grid item md={6} sm={12}>
            <Stack direction="column" spacing={1}>
              <Typography variant="subtitle1">
                {conceptAssignment.name}
              </Typography>

              <Stack direction="column" spacing={1}>
                <Typography variant="body2">
                  {BuildingTypeTranslations[conceptAssignment.details.buildingType]}
                </Typography>
                <Typography variant="body2" sx={{'paddingBottom': '20px'}}>
                  Bewerbungsfrist: {formatDate(conceptAssignment.assignmentEnd || '')}
                </Typography>
                <Typography variant="body2" sx={{'paddingBottom': '20px'}}>
                  Status: <strong>{CandidatureStateTranslations[candidature.state]}</strong>
                </Typography>
                {candidature.state === 'SUBMITTED' &&
                <Button variant="outlined" sx={{'maxWidth': '50%'}} onClick={() => {
                  setShowRevokeModal(true)
                }}
                >Bewerbung zurückziehen</Button>
                }
              </Stack>
            </Stack>
          </Grid>
          <Grid item md={4} sm={8}>
            <Stack direction="column" spacing={1}>
              <Typography variant="subtitle1">Vergabe-Dokumente</Typography>

              <AttachmentReadonlyList
                attachments={conceptAssignmentWithAttachments.attachments}
                baseDownloadUrl={`/api/assignment/${conceptAssignment.id}/attachment`}
              />
            </Stack>
          </Grid>
          <Grid item md={2} sm={4}>
            <ChatBox withLabel for='candidate' candidatureId={candidature.id}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>

    <Card>
      <CardContent>
        <Stack direction="column" spacing={2}>
          <Typography variant="subtitle2">
            Kurzbeschreibung Ihres Bauvorhabens
          </Typography>
          <Typography variant="body2" sx={{whiteSpace: 'pre-line'}}>
            {candidature.description}
          </Typography>

          <QuestionInputs
            candidature={props.candidature}
            questions={conceptAssignment.questions}
            answers={candidature.answers}
            readonly={true}
          />

          <Typography variant="subtitle2">
            Anhänge
          </Typography>

          <AttachmentReadonlyList
            attachments={candidatureWithAttachments.attachments}
            baseDownloadUrl={`/api/candidate/candidatures/${candidature.id}/attachments`}
          />
        </Stack>
      </CardContent>
    </Card>
    {showRevokeModal &&
    <CandidatureRevokeModal
      onSuccess={() => {
        setShowRevokeModal(false)
        submitRevokeMutation.mutate({})
      }}
      onClose={() => setShowRevokeModal(false)}
    />
    }
  </Stack>
}
