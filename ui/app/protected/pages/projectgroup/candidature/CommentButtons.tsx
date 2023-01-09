import React, {FunctionComponent} from 'react';
import {IconButton, Link, Stack, Tooltip, Typography} from '@mui/material';
import {formatDate} from '@common/util/DateFormatter';
import {Edit} from '@mui/icons-material';
import {AdminCandidatureView} from '@protected/pages/projectgroup/queries/candidature';

interface Props {
    data: AdminCandidatureView
    onEdit: (data: AdminCandidatureView) => void
}

export const CommentButtons: FunctionComponent<Props> = (props) => {
  const comment = props.data.comment

  if (comment && comment.text && comment.updated) {
    return <Stack direction='column' spacing={1}>
      <Stack direction='row' spacing={1} alignItems='center'>
        <Typography variant='caption'>Notiz vom {formatDate(comment.updated)}</Typography>
        <Tooltip title='Notiz editieren'>
          <IconButton size='small' onClick={() => props.onEdit(props.data)}><Edit/></IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  } else {
    return <Typography variant='body2'>
      <Link sx={{cursor: 'pointer'}} onClick={() => props.onEdit(props.data)}>Notiz erstellen</Link>,
      um den Zustand der Bewerbung zu dokumentieren?
    </Typography>
  }
}
