import {LoadingButton} from '@common/component/LoadingButton';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, Stack,
} from '@mui/material';
import JoditEditor from 'jodit-react';
import React, {FunctionComponent} from 'react';
import { AdminCandidatureView, upsertComment } from '../queries/candidature';
import { getUsername } from './CandidatureDetail';

interface Props {
  d: AdminCandidatureView
  onCancel: () => void
  updateFromMutation: (ca: AdminCandidatureView) => void
}

const config = {
  editorCssClass: `texts-editor-comment`,
  buttons: [
    'undo', 'redo', '|',
    'bold', 'italic', 'underline', 'strikethrough', '|',
    'superscript', 'subscript', '|',
    'ul', 'ol', '|',
    'outdent', 'indent', '|',
    'font', 'fontsize', 'brush', 'paragraph', '|',
    'table', 'link', '|',
    'align', '|',
    'fullsize', 'source', '|',
    'selectall', 'cut', 'copy', 'paste', '|',
    'symbol', 'hr', 'eraser', '|',
    'print', 'about',
  ],

  style: {
    height: 500,
  },
}

export const AdminCandidatureCommentModal: FunctionComponent<Props> = ({
  d,
  onCancel,
  updateFromMutation,
}) => {
  const [value, setValue] = React.useState<string | null>(d.comment?.text || null)
  const mutation = useBetterMutation(() => upsertComment(d.details.candidatureWithAttachments.candidature.id, {text: value}),
      {
        onSuccess: (r) => updateFromMutation(r.data),
      },
  )

  return <Dialog
    fullScreen
    disableEnforceFocus
    open={true}
    aria-label="Bewerbungsnotiz"
  >
    <DialogTitle>
      Notiz: Bewerbung {getUsername(d.user)}
    </DialogTitle>
    <DialogContent>
      <Stack direction="column" spacing={1}>
        <JoditEditor
          {...{id: `editor-comment`} as any}
          value={value || ''}
          config={config}
          onBlur={(value) => setValue(value)}
        />

        {mutation.isError ? <Alert severity="error">Fehler beim Speichern der Notiz</Alert> : null}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onCancel}>Abbrechen</Button>
      <LoadingButton
        loading={mutation.isLoading}
        variant="contained"
        onClick={mutation.mutate} >
        Notiz Speichern
      </LoadingButton>
    </DialogActions>
  </Dialog>
}
