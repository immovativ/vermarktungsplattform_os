
import { CandidatureMessageDirection, getMessages } from '@common/queries/messaging';
import { ChatBubble } from '@mui/icons-material';
import { Alert, Badge, Button, CircularProgress, IconButton, Popover, PopoverOrigin, Tooltip,
} from '@mui/material';
import React, {FunctionComponent} from 'react';
import { useQuery } from 'react-query';
import { ChatBoxContents } from './ChatBoxContents';

export type ChatBoxCaller = 'admin' | 'candidate'

interface Props {
    for: ChatBoxCaller
    candidatureId: string
    anchorOrigin?: PopoverOrigin
    transformOrigin?: PopoverOrigin
    displayName?: string
    withLabel?: boolean
}

export const ChatBox: FunctionComponent<Props> = (props) => {
  const query = useQuery(['messaging', props.for, props.candidatureId], () => getMessages(props.candidatureId, props.for))

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
    query.refetch()
  }

  const messageForMe: CandidatureMessageDirection = props.for === 'candidate' ? 'ADMIN_TO_USER' : 'USER_TO_ADMIN'
  const unreadCount = query.data?.data?.filter((m) => m.direction === messageForMe && m.seenAt === null)?.length

  return (<>
    {
    props.withLabel ? <Button
      color="secondary"
      endIcon={
          unreadCount && unreadCount > 0 ? <Badge badgeContent={unreadCount} color="primary">
            <ChatBubble color="action" />
          </Badge> : <ChatBubble color="action" />
      }
      onClick={handleClick}
    >
      Nachrichten
    </Button> : <Tooltip title={unreadCount && unreadCount > 0 ? 'Es liegen neue Nachrichten vor' : 'Nachrichten'} arrow placement='left'>
      <IconButton onClick={handleClick}>
        {unreadCount && unreadCount > 0 ? <Badge badgeContent={unreadCount} color="primary">
          <ChatBubble color="action" />
        </Badge> : <ChatBubble color="action" />}
      </IconButton>
    </Tooltip>
    }
    <Popover
      id={anchorEl ? 'chat-popover' : undefined}
      open={anchorEl ? true : false}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={props.anchorOrigin || { vertical: 'top', horizontal: 'right' }}
      transformOrigin={props.transformOrigin || { horizontal: 'right', vertical: 'bottom' }} >
      {query.isLoading && <CircularProgress sx={{m: 5}} />}
      {query.isError && <Alert variant='outlined' severity='error'>Fehler beim Laden der Nachrichten. Bitte versuchen Sie es erneut.</Alert>}
      {query.data && <ChatBoxContents candidatureId={props.candidatureId} for={props.for} contents={query.data.data}
        requestClose={handleClose} displayName={props.displayName} />}
    </Popover>
  </>)
}
