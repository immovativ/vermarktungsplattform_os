import { Box, Link, Typography } from '@mui/material';
import React, {FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  leftText: string
  rightText: string

  rightLink?: string
}

export const BrandLine: FunctionComponent<Props> = (props) => {
  const navigate = useNavigate()
  return <Box display='flex' flexDirection='row' alignItems='center'>
    <Typography variant='body1'>{props.leftText}</Typography>
    <Box sx={{ flexGrow: 1 }} />
    <Typography variant='h5' color='primary'>
      {props.rightLink ? <Link sx={{cursor: 'pointer'}}
        onClick={() => props.rightLink && navigate(props.rightLink)}>{props.rightText}</Link> : props.rightText}
    </Typography>
  </Box>
}
