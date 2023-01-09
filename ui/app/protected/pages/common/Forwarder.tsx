import { CircularProgress } from '@mui/material';
import React, {FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';

export const Forwarder: FunctionComponent<{to: string}> = (props) => {
  const navigate = useNavigate()

  React.useEffect(() => {
    navigate(props.to)
  }, [])

  return <CircularProgress />
}
