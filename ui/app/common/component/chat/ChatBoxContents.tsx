import { useBetterMutation } from '@common/hooks/useBetterMutationHook';
import { CandidatureMessage, CandidatureMessageDirection, markRead, postMessage, uploadAttachment } from '@common/queries/messaging';
import { AttachFile, Close, Delete, Send } from '@mui/icons-material';
import { Alert, Box, Card, CardContent, CardHeader, Divider, IconButton, Stack, styled, TextField, Tooltip, Typography,
} from '@mui/material';
import React, {FunctionComponent} from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { LoadingIconButton } from '../LoadingButton';
import { MessageEntry } from './MessageEntry';

export type ChatBoxCaller = 'admin' | 'candidate'

interface Props {
    for: ChatBoxCaller
    candidatureId: string
    contents: readonly CandidatureMessage[]
    requestClose: () => void
    displayName?: string
}
const Input = styled('input')({
  display: 'none',
})
function messageAuthor(caller: ChatBoxCaller, direction: CandidatureMessageDirection): 'me' | 'other' {
  if (caller === 'admin') {
    return direction === 'ADMIN_TO_USER' ? 'me' : 'other'
  } else {
    return direction === 'USER_TO_ADMIN' ? 'me' : 'other'
  }
}

export const ChatBoxContents: FunctionComponent<Props> = (props) => {
  const [messageContent, setMessageContent] = React.useState('')
  const [attachment, setAttachment] = React.useState<File | null>(null)

  const markReadQuery = useQuery(['messaging.markRead', props.for, props.candidatureId], () => markRead(props.candidatureId, props.for),
      {refetchOnWindowFocus: false, refetchInterval: 1000 * 10, refetchOnMount: true, refetchOnReconnect: false, cacheTime: 1000 * 5})
  const queryClient = useQueryClient()
  const writeMessage = useBetterMutation((payload: {contents: string}) => postMessage(props.candidatureId, props.for, payload),
      {
        onSuccess: (r) => {
          setAttachment(null)
          setMessageContent('')
          queryClient.setQueryData(['messaging', props.for, props.candidatureId], r)
          markReadQuery.refetch()
        },
      },
  )
  const addAttachment = useBetterMutation((file: File) => uploadAttachment(props.candidatureId, file, props.for),
      {
        onSuccess: (r) => {
          setAttachment(null)
          queryClient.setQueryData(['messaging', props.for, props.candidatureId], r)
          markReadQuery.refetch()
        },
      },
  )
  const [messageEnd, setMessageEnd] = React.useState<HTMLDivElement | null>(null)
  const scrollToBottom = () => {
    messageEnd && messageEnd.scrollIntoView({ behavior: 'smooth' });
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messageEnd, props.contents.length])

  return (
    <Card>
      <CardHeader
        title={`Nachrichten von ${props.displayName || (props.for === 'candidate' ? 'Projektgruppe Dietenbach' : 'Bewerber:in')}`}
        action={
          <Tooltip arrow title='Schliessen' placement='top'>
            <IconButton
              aria-label="close"
              onClick={() => {
                markReadQuery.refetch()
                props.requestClose()
              }}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <Close />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        <Stack direction='column' spacing={1}>
          <Box display='flex' flexDirection='column' sx={{maxHeight: '20vh', overflowY: 'auto', minWidth: '30vw', maxWidth: '50vw'}}>
            {props.contents.length === 0 && <Alert variant='outlined' severity='info'>Es sind noch keine Nachrichten vorhanden</Alert>}
            {props.contents.map((message) => <MessageEntry key={message.messageId} msg={message} caller={props.for}
              from={messageAuthor(props.for, message.direction)} />)}
            <div style={{ float: 'left', clear: 'both' }} ref={(el) => {
              setMessageEnd(el)
            }}> </div>
          </Box>
          <Divider />
          <form onSubmit={(e) => {
            e.preventDefault()
            if (writeMessage.isLoading || addAttachment.isLoading) {
              return
            }
            if (attachment !== null) {
              addAttachment.mutate(attachment)
            } else if (messageContent.trim().length > 0) {
              writeMessage.mutate({contents: messageContent})
            }
          }}>
            <Stack direction='column' spacing={1}>
              <Stack direction='row' spacing={1}>
                {attachment ? <>
                  <Stack display='inline-flex' width='100%' direction='row' spacing={1} alignItems='center'>
                    <Typography variant='body2' color='text.secondary'>Datei: </Typography><Typography variant='body2'>{attachment.name}</Typography>
                    <IconButton onClick={() => setAttachment(null)}><Delete /></IconButton>
                  </Stack>
                </> :
                  <TextField fullWidth label="Nachricht" variant="standard" value={messageContent} onChange={(e) => setMessageContent(e.target.value)} />
                }

                {attachment === null && <label htmlFor="contained-button-file">
                  <Input onChange={(f) => setAttachment(f.target.files ? f.target.files[0] : null)} id="contained-button-file" type="file" />
                  <IconButton component="span">
                    <AttachFile />
                  </IconButton>
                </label>}
                <LoadingIconButton loading={writeMessage.isLoading || addAttachment.isLoading} type="submit">
                  <Send />
                </LoadingIconButton>
              </Stack>
            </Stack>
          </form>
        </Stack>
      </CardContent>
    </Card>
  )
}
