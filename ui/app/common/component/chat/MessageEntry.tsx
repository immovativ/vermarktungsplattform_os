
import { CandidatureMessage, getAttachmentDownloadLink } from '@common/queries/messaging';
import { Download } from '@mui/icons-material';
import { Box, Grid, Link, styled, Typography,
} from '@mui/material';
import React, {FunctionComponent} from 'react';

export type ChatBoxCaller = 'admin' | 'candidate'

interface Props {
    msg: CandidatureMessage
    from: 'me' | 'other'
    caller: ChatBoxCaller
}

const LeftMessageEntry = styled(Typography)(({theme})=> ({
  borderTopLeftRadius: 5,
  borderTopRightRadius: 5,
  borderBottomRightRadius: 5,
  display: 'inline-block',
  color: 'white',
  backgroundColor: theme.palette.primary.main,
  wordBreak: 'break-word',
  marginBottom: theme.spacing(1),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
}))

const RightMessageEntry = styled(Typography)(({theme})=> ({
  borderTopRightRadius: 5,
  borderTopLeftRadius: 5,
  borderBottomLeftRadius: 5,
  color: 'white',
  backgroundColor: theme.palette.secondary.main,
  display: 'inline-block',
  wordBreak: 'break-word',
  marginBottom: theme.spacing(1),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
}))

const InnerMessageWrapper = styled('span')({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
})

function renderContents(msg: CandidatureMessage, caller: ChatBoxCaller): JSX.Element | string {
  if (msg.attachment !== null) {
    return <span><Link color='#FFFFFF' target='_blank' href={getAttachmentDownloadLink(msg.messageId, msg.candidatureId, caller)}>
      <InnerMessageWrapper>
        {msg.attachment.name}&nbsp;<Download fontSize='inherit' />
      </InnerMessageWrapper>
    </Link>
    </span>
  } else {
    return msg.contents
  }
}

export const MessageEntry: FunctionComponent<Props> = (props) => {
  return <Grid
    container
    justifyContent={props.from === 'me' ? 'flex-end' : 'flex-start'} >
    <Grid item xs={8}>
      <Box sx={{textAlign: props.from === 'me' ? 'right' : 'left', ml: 2, mr: 2}}>
        {props.from === 'me' ? <RightMessageEntry variant='body1'>{renderContents(props.msg, props.caller)}</RightMessageEntry> :
        <LeftMessageEntry variant='body1'>{renderContents(props.msg, props.caller)}</LeftMessageEntry>}
      </Box>
    </Grid>
  </Grid>
}
