import React, {FunctionComponent} from 'react';
import {Breadcrumbs, Card, CardContent, Link, Stack, Typography} from '@mui/material';
import { getSession } from '@common/navigation/session/Session';
import { UserRole } from '@protected/model/user/UserRole';

export const AppHeader: FunctionComponent = () => {
  const session = getSession()
  return <Card sx={{borderTopLeftRadius: 0, borderTopRightRadius: 0}}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="column">
          <Link href="/protected/login">
            <img src="https://ris.freiburg.de/user_layout/images/logo.png" />
            <img src="https://www.immovativ.de/freiburg/images/logo-dietenbach.jpg" />
          </Link>
        </Stack>
        <Stack direction="column" alignItems="end" justifyContent="space-between">
          <Breadcrumbs separator="|">
            {(session === null || session?.role === UserRole.CANDIDATE) && <Link href="/vergabe">Zur Grundstücksvergabe</Link>}
            <Link href="/impressum">Impressum</Link>
            <Link href="/datenschutz">Datenschutz</Link>
          </Breadcrumbs>
          <Typography variant="h5" align="left" sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
            Grundstücksvergabe Dietenbach
          </Typography>
        </Stack>
      </Stack>
    </CardContent>
  </Card>
}
