import {Avatar, Button, Grid, MenuList, Paper, Typography, Link as MuiLink, Box} from '@mui/material';
import React, {FunctionComponent, useEffect, useRef, useState} from 'react';
import {getSession, Session} from './session/Session';
import {Link, useNavigate, RouteObject} from 'react-router-dom';
import axios from 'axios';
import {MenuEntry} from './MenuEntry';
import LogoutIcon from '@mui/icons-material/Logout';
import ShieldIcon from '@mui/icons-material/Shield';
import { UserRole } from '@protected/model/user/UserRole';


export type MenuEntry = RouteObject & {
  fuzzyMatch?: boolean
  icon?: React.ReactChild
  text: React.ReactChild
  children?: MenuEntry[]
  breadcrumbKey?: string
  external?: boolean
}

export interface MainMenuProps {
  entries: MenuEntry[]
}

export const MainMenu: FunctionComponent<MainMenuProps> = (props) => {
  const timerRef = useRef<number | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const session = getSession()
    if (session != null) {
      setSession(session)

      // immediately check if our auth is still ok
      // the refresh call trashes the ui cookie if invalid
      axios
          .get('/api/authorization/refresh')
          .catch((e) => {
            console.error(`Error while refreshing the session: `, e)
          })

      timerRef.current = window.setInterval(() => {
        axios
            .get('/api/authorization/refresh')
            .catch((e) => {
              console.error(`Error while refreshing the session: `, e)
            })
      }, 30000)

      return function cleanup() {
        if (timerRef.current != null) {
          window.clearInterval(timerRef.current)
        }
      }
    } else {
      navigate('/protected/login')
    }
  }, [])

  return (
    <Grid container
      direction="column"
      flexWrap="nowrap"
      sx={{
        height: 'calc(100vh - 160px)',
        top: '16px',
        width: '300px',
        position: 'sticky',
      }}
    >
      <Grid container component={Paper} elevation={0}
        alignItems="center"
        direction="row"
        wrap='nowrap'
        sx={{
          bgcolor: 'grey.100',
          px: 2,
          py: 3,
          borderRadius: 2,
          mb: 2,
          height: '100px',
        }}>
        <Avatar
          sx={{bgcolor: 'secondary.main', mr: 1.5}}
        >
          {session?.role == UserRole.PROJECT_GROUP ? <ShieldIcon /> : null}
        </Avatar>
        <Box sx={{display: 'flex', flexDirection: 'column'}}>
          <Typography variant="overline" lineHeight={1.5} sx={{wordWrap: 'anywhere'}}>
            {session?.email}
          </Typography>
          <MuiLink variant="caption" component={Link} to='/protected/profile'>
            Account verwalten
          </MuiLink>
        </Box>
      </Grid>
      <Grid
        container
        flexGrow='1'
        direction='column'
        sx={{
          border: 1,
          borderColor: 'grey.200',
          bgcolor: 'grey.100',
          borderRadius: 2,
        }}
      >
        {props.children}
        <Grid item component={MenuList} flexGrow='1'>
          {props.entries.map((entry) =>
            <MenuEntry key={entry.path} to={entry.path ?? '/'} exactActive={!entry.fuzzyMatch} external={entry.external}>
              {entry.icon}
              {entry.text}
            </MenuEntry>,
          )}
        </Grid>
        <Grid item flexShrink="1" sx={{p: 1}}>
          <Button fullWidth
            variant='outlined'
            startIcon={<LogoutIcon />}
            onClick={() => axios.post('/api/logout').then(() => navigate('/protected/login'))}
          >
            Abmelden
          </Button>
        </Grid>
      </Grid>
    </Grid>
  )
}
