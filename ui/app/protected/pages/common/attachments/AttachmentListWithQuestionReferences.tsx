import React, {FunctionComponent, useMemo} from 'react';
import {
  AdminConceptAssignmentDetail, AttachmentMetadata,
} from '@protected/pages/projectgroup/queries/concept-assignment';
import {
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {Delete} from '@mui/icons-material';
import {renderAttachmentIcon} from '@protected/pages/projectgroup/draft/DraftDetail';
import {FileUploadQuestion} from '@protected/pages/common/questions/questions';
import {DeleteAttachmentFromQuestionModal} from '@protected/pages/common/attachments/DeleteAttachmentFromQuestionModal';

interface Props {
  concept: AdminConceptAssignmentDetail
  attachments: readonly AttachmentMetadata[]
  deleteAttachment: (id: string) => void
  baseDownloadUrl: string
}

export const AttachmentListWithQuestionReferences: FunctionComponent<Props> = (props) => {
  const questions = props.concept.questions?.questions

  const fileUploadQuestions = useMemo(() =>
    questions
        ?.filter((question) => question.type === 'fileUploadQuestion')
        .map((question) => question as FileUploadQuestion),
  [questions],
  )

  const [showDeleteAttachmentDialog, setShowDeleteAttachmentDialog] = React.useState(false)
  const [fileUploadQuestion, setFileUploadQuestion] = React.useState<FileUploadQuestion | undefined>(undefined)

  return <>
    {showDeleteAttachmentDialog && fileUploadQuestion && questions &&
      <DeleteAttachmentFromQuestionModal
        questions={questions}
        conceptAssignmentId={props.concept.id}
        questionToDelete={fileUploadQuestion}
        onClose={() => setShowDeleteAttachmentDialog(false)}
        onDelete={(attachmentId: string) => {
          props.deleteAttachment(attachmentId)
          setShowDeleteAttachmentDialog(false)
          setFileUploadQuestion(undefined)
        }}
      />
    }
    <List dense>
      {props.attachments.length === 0 &&
        <Alert severity="info" variant="outlined">Es sind keine Anhänge vorhanden.</Alert>}
      {props.attachments.map((attachment) => <ListItem key={attachment.id}
        secondaryAction={<>
          <IconButton
            aria-label="delete"
            onClick={() => {
              const maybeReference = fileUploadQuestions?.find((question) => question.attachmentMetadata?.id === attachment.id)

              if (maybeReference) {
                setShowDeleteAttachmentDialog(true)
                setFileUploadQuestion(maybeReference)
              } else {
                props.deleteAttachment(attachment.id)
              }
            }}>
            <Delete/>
          </IconButton>
        </>}
      >

        <ListItemButton component="a" href={`${props.baseDownloadUrl}/${attachment.id}`}
          target="_blank">
          <ListItemIcon>
            {renderAttachmentIcon(attachment.contentType)}
          </ListItemIcon>
          <ListItemText primary={attachment.name}/>
        </ListItemButton>
      </ListItem>)}
    </List>
  </>
}
