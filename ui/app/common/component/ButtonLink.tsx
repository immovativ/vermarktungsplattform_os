import React from 'react'
import { Button, ButtonProps } from '@mui/material';
import { Link, LinkProps } from 'react-router-dom';

const LinkBehavior = React.forwardRef<
  any,
  Omit<LinkProps, 'to'> & { href: LinkProps['to'] }
>((props, ref) => {
  const { href, ...other } = props;
  // Map href (MUI) -> to (react-router)
  return <Link ref={ref} to={href} {...other} />;
});
export const ButtonLink = (props: ButtonProps) => <Button {...props} LinkComponent={LinkBehavior} />
