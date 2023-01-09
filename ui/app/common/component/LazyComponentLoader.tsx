import React, {FC} from 'react';
import {CircularProgress, Stack, Typography} from '@mui/material'
import { styled } from '@mui/system';

const LoaderStack = styled(Stack)(() => ({
  height: '200px',
}))

interface LoaderProps {
  additionalText?: string | undefined
}
export const LazyComponentLoader: FC<LoaderProps> = (props) => {
  return <React.Suspense fallback={
    <LoaderStack direction='column' alignItems='center' justifyContent='center'>
      {
        props.additionalText && <Typography sx={{mb: 1}}>{props.additionalText}</Typography>
      }
      <CircularProgress />
    </LoaderStack>
  }>
    {props.children}
  </React.Suspense>
}
