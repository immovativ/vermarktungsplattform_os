import { ButtonProps, CircularProgress, IconButton, IconButtonProps } from '@mui/material';
import Button from '@mui/material/Button';
import * as React from 'react';

export const LoadingButton: React.FunctionComponent<
  { loading?: boolean } & ButtonProps
> = ({ loading, ...props }) => {
  const loadingProps = loading ?
    { disabled: true, startIcon: <CircularProgress size={16} color={'grey' as any} /> } :
    {};
  return <Button {...props} {...loadingProps} />;
}

export const LoadingIconButton: React.FunctionComponent<
  { loading?: boolean } & IconButtonProps
> = ({ loading, ...props }) => {
  return !loading ? <IconButton {...props} /> :
  <IconButton {...props} {...{ disabled: true, children: <CircularProgress size={16} color={'grey' as any} /> }} />
}
