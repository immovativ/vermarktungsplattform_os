import { UserRole } from '@protected/model/user/UserRole';
import {MenuItem, SxProps} from '@mui/material';
import {Theme} from '@mui/system';
import React, {FunctionComponent} from 'react';
import {useMatch, useResolvedPath} from 'react-router';
import { getSession } from './session/Session';
import { Link } from 'react-router-dom';

export interface MenuEntryProps {
  to: string
  exactActive?: boolean
  forRole?: UserRole
  external?: boolean
}

const passiveProps: SxProps<Theme> = {
  color: 'grey.800',
}

const activeProps: SxProps<Theme> = {
  color: 'primary.600',
  bgcolor: 'grey.200',
  fontWeight: 600,
  borderLeft: 2,
  borderLeftColor: 'primary.dark',
  borderLeftWidth: 2,
}

export const MenuEntry: FunctionComponent<MenuEntryProps> = (props) => {
  const resolved = useResolvedPath(props.to);
  const session = getSession()

  const match = useMatch({
    path: resolved.pathname,
    end: props.exactActive == undefined ? true : props.exactActive,
  });

  if (props.forRole && props.forRole != session?.role) {
    return null
  }

  if (props.external) {
    return <MenuItem component="a" sx={{...(match ? activeProps : passiveProps), pt: 1.5, pb: 1.5}} href={props.to} >
      {props.children}
    </MenuItem>
  } else {
    return <MenuItem component={Link} sx={{...(match ? activeProps : passiveProps), pt: 1.5, pb: 1.5}} to={props.to}>
      {props.children}
    </MenuItem>
  }
}
