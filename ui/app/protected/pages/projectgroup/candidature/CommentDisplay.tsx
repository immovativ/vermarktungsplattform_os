import React, {FunctionComponent, useRef, useState} from 'react';
import { AdminCandidatureView, AdminComment} from '@protected/pages/projectgroup/queries/candidature';
import { Box, Button, CardContent, CardHeader, DialogActions, IconButton, Paper, PaperProps, Stack, Typography } from '@mui/material';
import { formatDate } from '@common/util/DateFormatter';
import JoditEditor from 'jodit-react';
import { useBetterMutation } from '@common/hooks/useBetterMutationHook';
import {upsertComment} from '../queries/candidature'
import { Close, NoteAddOutlined } from '@mui/icons-material';
import Draggable from 'react-draggable';
import ReactDOM from 'react-dom';

const buttons =[
  'bold',
  'italic',
  'strikethrough',
  'underline',
  'italic',
  '|',
  'ul',
  'ol',
  '|',
  'fontsize',
  'table',
  'link',
  'paragraph',
]

const config = {
  editorCssClass: `editor-comment`,
  buttons: buttons,
  buttonsMD: buttons,
  buttonsSM: buttons,
  buttonsXS: buttons,
  style: {
    height: 250,
  },
}

function DraggablePaper(props: PaperProps) {
  const nodeRef = useRef<HTMLDivElement>(null)
  return (
    <Draggable
      nodeRef={nodeRef}
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper
        ref={nodeRef}
        {...props}
        sx={{
          ...props.sx,
          resize: 'horizontal',
          zIndex: 1300,
          overflow: 'hidden',
          minWidth: 250,
          position: 'fixed',
        }} />
    </Draggable>
  );
}

interface Props {
    candidatureId: string
    comment: AdminComment | null
    updateFromMutation: (ca: AdminCandidatureView) => void
}

export const CommentDisplay: FunctionComponent<Props> = ({candidatureId, comment, updateFromMutation}) => {
  const [popperOpen, setPopperOpen] = useState(false)
  const [note, setNote] = useState(comment?.text ?? '')
  const mutation = useBetterMutation(() => upsertComment(candidatureId, {text: note}),
      {
        onSuccess: (r) => updateFromMutation(r.data),
      },
  )

  return <>
    <Box>
      <Button
        endIcon={<NoteAddOutlined />}
        onClick={() => setPopperOpen(true)}
        color="secondary"
      >
        {comment === null ? 'Kommentar hinzufügen' : 'Kommentar editieren'}
      </Button>
    </Box>
    {popperOpen && ReactDOM.createPortal(<DraggablePaper sx={{position: 'absolute', top: '33%', left: '50%'}}>
      <CardHeader
        style={{ cursor: 'move' }}
        id="draggable-dialog-title"
        title={'Notizen'}
        action={
          <IconButton onClick={() => setPopperOpen(false)}>
            <Close />
          </IconButton>
        }
      >
      </CardHeader>
      <CardContent>
        <JoditEditor
          {...{id: `editor-comment`} as any}
          value={note}
          config={config}
          onBlur={(value) => setNote(value)}
        />
      </CardContent>
      <DialogActions >
        <Stack direction="row" justifyContent='space-between' sx={{width: '100%'}}>
          <Box>
            {comment?.updated && <Typography variant="body2">{formatDate(comment?.updated)}</Typography>}
          </Box>
          <Button onClick={mutation.mutate}>Speichern</Button>
        </Stack>
      </DialogActions>
    </DraggablePaper>, document.body)}
  </>
}
