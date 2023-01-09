import {Box, Breadcrumbs, Card, CardContent, Container, CssBaseline, Link, Stack, Typography} from '@mui/material';
import { ThemeProvider} from '@mui/material/styles';
import React, {FC, FunctionComponent} from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { theme } from '@common/theme';
import { Router } from './Router';
import { BreadcrumbContext, ProvidedBreadcrumbWrapper, useBreadcrumb } from '@common/navigation/breadcrumb/useBreadcrumb';
import { MenuEntry } from '@common/navigation/MainMenu';
import { BrowserRouter } from 'react-router-dom';


const menu: MenuEntry[] = [{
  text: 'Startseite',
  path: '/',
  children: [{
    text: 'Ablauf der Bewerbung',
    path: '/ablauf-bewerbung',
  }, {
    text: 'Vergabe',
    path: '/vergabe',
  }, {
    text: 'Vergabe',
    breadcrumbKey: 'assignment-name',
    path: 'vergabe/:id',
  }, {
    text: 'Impressum',
    path: '/impressum',
  }, {
    text: 'Datenschutz',
    path: '/datenschutz',
  }, {
    text: 'Baurecht',
    path: '/baurecht',
  }],
}]

export const BetterBreadcrumbs: FC = () => {
  const breadcrumbs = useBreadcrumb()
  return (
    <Breadcrumbs sx={{my: 1}}>
      {breadcrumbs}
    </Breadcrumbs>
  )
}
export const queryClient = new QueryClient()
export const App: FunctionComponent = () => {
  return (
    <ProvidedBreadcrumbWrapper>
      <BreadcrumbContext.Provider value={menu}>

        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Stack direction="column" minHeight={'100vh'} height={'100%'}>
                <Card elevation={0}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Link href="/">
                        <img src="https://ris.freiburg.de/user_layout/images/logo.png" alt="Logo der Stadt Freiburg" />
                        <img src="https://www.immovativ.de/freiburg/images/logo-dietenbach.jpg" />
                      </Link>

                      <Stack direction="column" alignItems="end" justifyContent="space-between">
                        <Breadcrumbs separator="|">
                          <Link href="/protected/login">Login</Link>
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
                <Container maxWidth={false}>
                  <BetterBreadcrumbs />
                </Container>
                <Box sx={{flexGrow: '1'}}>
                  <Router />
                </Box>
              </Stack>
            </ThemeProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </BreadcrumbContext.Provider>
    </ProvidedBreadcrumbWrapper>
  )
}
