import React, {FunctionComponent} from 'react';
import {AttachmentMetadata} from '@protected/pages/projectgroup/queries/concept-assignment';
import {Alert, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText} from '@mui/material';
import {Delete} from '@mui/icons-material';
import {renderAttachmentIcon} from '@protected/pages/projectgroup/draft/DraftDetail';

interface Props {
  attachments: readonly AttachmentMetadata[]
  deleteAttachment: (id: string) => void
  baseDownloadUrl: string
}

export const AttachmentList: FunctionComponent<Props> = (props) => {
  return <List dense>
    {props.attachments.length === 0 && <Alert severity='info' variant='outlined'>Es sind keine Anhänge vorhanden.</Alert>}
    {props.attachments.map((attachment) => <ListItem key={attachment.id}
      secondaryAction={<>
        <IconButton aria-label="delete"
          onClick={() => props.deleteAttachment(attachment.id)}>
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
}
