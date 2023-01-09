import React, {FunctionComponent, useContext} from 'react';
import {FileUploadQuestion} from '@protected/pages/common/questions/questions';
import {Button, IconButton, Input, Stack, Tooltip, Typography} from '@mui/material';
import {renderAttachmentIcon} from '@protected/pages/projectgroup/draft/DraftDetail';
import {CandidatureAndConceptAssignmentWithAttachments} from '@protected/model/candidature/Candidature';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {deleteAttachment, uploadAttachment} from '@protected/pages/candidate/queries';
import {AttachmentMetadata} from '@protected/pages/projectgroup/queries/concept-assignment';
import {Delete} from '@mui/icons-material';
import { DelegatedIdContext } from '@common/util/DelegatedIdContext';

interface Props {
  candidature?: CandidatureAndConceptAssignmentWithAttachments
  question: FileUploadQuestion
  answer: string | undefined
  onChange: (answer: string) => void
  readonly: boolean
}

export const FileUploadQuestionInput: FunctionComponent<Props> = React.memo((props) => {
  const maybeDelegatedId = useContext(DelegatedIdContext)
  if (!props.candidature) {
    return null
  }

  const candidature = props.candidature.candidatureWithAttachments.candidature
  const conceptAssignmentId = props.candidature.conceptAssignmentWithAttachments.assignment.id
  const answer: AttachmentMetadata | undefined = props.answer ? JSON.parse(props.answer) : undefined

  if (props.readonly && answer) {
    return <Stack direction="row" alignItems="center" spacing={1}>
      {renderAttachmentIcon(answer.contentType)}
      <Button component="a" href={`/api/candidate/candidatures/${candidature.id}/attachments/${answer.id}`} variant="text" size="small">
        {answer.name}
      </Button>
    </Stack>
  }

  if (props.readonly) {
    return null
  }

  const uploadAttachmentMutation = useBetterMutation((payload: FileList) => uploadAttachment(candidature.id, payload[0], maybeDelegatedId),
      {
        onSuccess: (response) => {
          props.onChange(JSON.stringify(response.data));
        },
      },
  )

  const deleteAttachmentMutation = useBetterMutation((attachmentId: string) => deleteAttachment(candidature.id, attachmentId, maybeDelegatedId),
      {
        onSuccess: () => {
          props.onChange('')
        },
      },
  )

  const attachmentMetadata = props.question.attachmentMetadata

  return <Stack direction="column" spacing={1}>
    {attachmentMetadata &&
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography>Laden Sie die Unterlage</Typography>
        {renderAttachmentIcon(attachmentMetadata.contentType)}
        <Button component="a" href={`/api/assignment/${conceptAssignmentId}/attachment/${attachmentMetadata.id}`} variant="text" size="small">
          {attachmentMetadata.name}
        </Button>
        <Typography>runter, füllen Sie aus und laden Sie hier wieder hoch.</Typography>
      </Stack>
    }
    {answer ?
      <Stack direction="row" alignItems="center" spacing={1}>
        {renderAttachmentIcon(answer.contentType)}
        <Button component="a" href={`/api/candidate/candidatures/${candidature.id}/attachments/${answer.id}`} variant="text" size="small">
          {answer.name}
        </Button>
        <Tooltip title="Löschen">
          <IconButton onClick={() => deleteAttachmentMutation.mutate(answer.id)} size="small">
            <Delete/>
          </IconButton>
        </Tooltip>
      </Stack> :
      <label htmlFor={`attachment-upload-button-${props.question.id}`}>
        <Input
          type="file"
          id={`attachment-upload-button-${props.question.id}`}
          sx={{display: 'none'}}
          onChange={(e) => {
            const target = e.target as HTMLInputElement

            target.files && uploadAttachmentMutation.mutate(target.files)
          }}
          onClick={(e) => {
            // reset the file input, don't know if we really need this, but the interwebz suggested it
            (e.target as HTMLInputElement).value = ''
          }}
        />
        <Button variant="contained" component="span" size="small">
          Antwort hochladen
        </Button>
      </label>
    }
  </Stack>
})
