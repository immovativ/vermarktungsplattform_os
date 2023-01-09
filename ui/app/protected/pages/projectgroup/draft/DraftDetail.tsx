import {
  Button,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { FunctionComponent } from 'react';
import {
  AdminConceptAssignmentDetailWithAttachments,
  deleteAttachment,
  uploadAttachment,
} from '../queries/concept-assignment';
import { TabPanel } from '@protected/pages/common/TabPanel';
import { DropzoneArea } from 'mui-file-dropzone';
import { useBetterMutation } from '@common/hooks/useBetterMutationHook';
import { FilePresent, Image, PictureAsPdf } from '@mui/icons-material';
import { StartDraftModal } from './StartDraftModal';
import { DetailEdit } from './DetailEdit';
import { QuestionEdit } from './QuestionEdit';
import {focusManager} from 'react-query';
import { AssignmentHeader } from '@protected/pages/common/assignments/AssignmentHeader';
import {
  AttachmentListWithQuestionReferences,
} from '@protected/pages/common/attachments/AttachmentListWithQuestionReferences';
import { CreateAnliegerButton } from './CreateAnliegerButton';


export function renderAttachmentIcon(mimeType: string): React.ReactNode {
  const m = mimeType.toLowerCase()
  if (m.startsWith('image')) {
    return <Image />
  }
  switch (m) {
    case 'application/pdf':
      return <PictureAsPdf />
    default: return <FilePresent />
  }
}

interface Props {
    detail: AdminConceptAssignmentDetailWithAttachments
    updateFromMutation: (ca: AdminConceptAssignmentDetailWithAttachments) => void
}

export const DraftDetail: FunctionComponent<Props> = (props) => {
  const concept = props.detail.assignment

  const [tabIndex, setTabIndex] = React.useState<0 | 1 | 2>(0)
  const [startModalOpen, setStartModalOpen] = React.useState(false)

  const deleteAttachmentMutation = useBetterMutation((attachmentId: string) => deleteAttachment(concept.id, attachmentId),
      {
        onSuccess: (r) => {
          props.updateFromMutation(r.data)
        },
      },
  )
  const uploadMutation = useBetterMutation((payload: File[]) => uploadAttachment(concept.id, payload[0]),
      {
        onSuccess: (r) => {
          props.updateFromMutation(r.data)
          focusManager.setFocused(undefined)
        },
      },
  )

  return <>
    {startModalOpen && <StartDraftModal
      cid={concept.id}
      onClose={() => setStartModalOpen(false)}
      onSuccess={(ca) => {
        setStartModalOpen(false)
        props.updateFromMutation(ca)
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
          onClick={() => setStartModalOpen(true)}
          variant='contained' color="primary">Vergabestart planen</Button>
      </Stack> }
    />
    <Tabs value={tabIndex} onChange={(_, idx) => setTabIndex(idx)} >
      <Tab label="Daten" />
      <Tab label="Unterlagen" />
      <Tab label="Bewerbungsfragen" />
    </Tabs>
    <TabPanel value={tabIndex} index={0}>
      <Stack direction='column' spacing={1}>
        <DetailEdit detail={props.detail} updateFromMutation={props.updateFromMutation} />
      </Stack>
    </TabPanel>
    <TabPanel value={tabIndex} index={1}>
      <Stack direction='column' spacing={1}>
        <Typography variant='h6'>Hochgeladene Unterlagen</Typography>
        <Typography variant='caption' color='text.secondary'>
          Diese Unterlagen werden mit dem Start der Vergabe öffentlich zugänglich.
        </Typography>
        <AttachmentListWithQuestionReferences
          concept={concept}
          attachments={props.detail.attachments}
          deleteAttachment={deleteAttachmentMutation.mutate}
          baseDownloadUrl={`/api/admin/concept-assignment/${concept.id}/attachment`}
        />
        <DropzoneArea
          showPreviews={false}
          showPreviewsInDropzone={false}
          getFileAddedMessage={(file) => `${file} wird hochgeladen`}
          getDropRejectMessage={(file) => `${file.name} wurde abgelehnt. Bitte laden Sie Anhänge unter 15MB hoch.`}
          getFileLimitExceedMessage={() => `Datei ist zu groß (bitte <15MB)`}
          dropzoneText='Dateien hierherziehen oder zum Auswählen klicken'
          filesLimit={1}
          maxFileSize={15000000}
          fileObjects={undefined}
          onChange={(files) => {
            focusManager.setFocused(false)
            files.length > 0 && uploadMutation.mutate(files)
          }} />
      </Stack>
    </TabPanel>
    <TabPanel value={tabIndex} index={2}>
      <Stack direction='column' spacing={1}>
        <QuestionEdit detail={props.detail} updateFromMutation={props.updateFromMutation} />
      </Stack>
    </TabPanel>
  </>
}
