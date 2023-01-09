import React, {FunctionComponent} from 'react';
import {AttachmentMetadata} from '@protected/pages/projectgroup/queries/concept-assignment';
import {Alert, Button, Divider, Stack} from '@mui/material';
import {renderAttachmentIcon} from '@protected/pages/projectgroup/draft/DraftDetail';

interface Props {
  attachments: readonly AttachmentMetadata[]
  baseDownloadUrl: string
}

export const AttachmentReadonlyList: FunctionComponent<Props> = (props) => {
  return <Stack direction="column" spacing={1}>
    {props.attachments.length === 0 && <Alert severity='info' variant='outlined'>Es sind keine Anhänge vorhanden.</Alert>}
    {props.attachments.map((attachment) =>
      <Stack direction="row" key={attachment.id} alignItems="center">
        {renderAttachmentIcon(attachment.contentType)}
        <Button component="a" href={`${props.baseDownloadUrl}/${attachment.id}`} variant="text" size="small">
          {attachment.name}
        </Button>
      </Stack>,
    )}
    {props.attachments.length > 0 &&
      <>
        <Divider/>
        <Button component="a" href={`${props.baseDownloadUrl}/zip`} variant="text" size="small">
        Alle Anhänge herunterladen
        </Button>
      </>
    }
  </Stack>
}
