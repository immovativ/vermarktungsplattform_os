import { Chip } from '@mui/material';
import React, { FunctionComponent} from 'react';
import { useQuery } from 'react-query';
import { ChatBoxCaller } from './MessageEntry';
import { getUnread } from '@common/queries/messaging';

interface Props {
    for: ChatBoxCaller
}

export const MenuMessageText: FunctionComponent<Props> = (props) => {
  const query = useQuery(['messaging.unread', props.for], () => getUnread(props.for), {refetchInterval: 1000 * 10})
  const count = query.data?.data?.length
  if (count && count > 0) {
    return <div>Meine Nachrichten&nbsp;<Chip size='small' label={count} color='primary' /></div>
  } else {
    return <div>Meine Nachrichten</div>
  }
}
